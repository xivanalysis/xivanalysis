import math from 'mathjsCustom'
import React from 'react'
import {Message, Icon} from 'semantic-ui-react'
import {i18nMark, Trans} from '@lingui/react'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Group, Item} from './Timeline'

const MIN_GCD = 1500
const MAX_GCD = 2500
const BASE_GCD = 2500
const CASTER_TAX = 100

const DEBUG_LOG_SAVED_GCDS = false && process.env.NODE_ENV !== 'production'

// NOTE: Caster tax refers to spells taking 0.1s longer than their tooltip claims if their cast time is at least as long as their recast time.
// See https://www.reddit.com/r/ffxiv/comments/8s05rn/the_recast_time_on_your_tooltip_can_be_up_to_85/, specifically:
//    There is also another issue that influences how long recast times actually take that isn’t as heavily influenced by fps but is still affected,
//    which is animation delay that happen between casts, this means that if you have a spell with a cast time that is equal to or
//    greater than the recast time you will end up taking longer between casts than the (re)cast time. The delay is around 100 ms at 100+ fps

export default class GlobalCooldown extends Module {
	static handle = 'gcd'
	static dependencies = [
		// We need this to normalise before us
		'precastAction', // eslint-disable-line xivanalysis/no-unused-dependencies
		'castTime', // eslint-disable-line xivanalysis/no-unused-dependencies
		'downtime',
		'speedmod',
		'timeline',
	]

	static i18n_id = i18nMark('core.gcd.title')
	static title = 'Global Cooldown'

	_castingEvent = null

	_estimatedBaseGcd = null
	_estimateGcdCount = -1

	_lastGcd = {
		isInstant: false,
		event: null,
	}
	gcds = []

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)
	}

	// Using normalise so the estimate can be used throughout the parse
	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Only care about player GCDs
			if (!this.parser.byPlayer(event) || !event.ability) { continue }
			const action = getAction(event.ability.guid)
			if (!action.onGcd) { continue }

			// eslint-disable-next-line default-case
			switch (event.type) {
			// wowa uses beginchannel for this...? need info for flamethrower/that ast skill/passage of arms
			case 'begincast':
				// Can I check for cancels?
				this._castingEvent = event
				break

			case 'cast':
				const hasBeginCast = this._castingEvent !== null && this._castingEvent.ability.guid === action.id
				const relevantEvent = hasBeginCast ? this._castingEvent : event
				this.saveGcd({...this._lastGcd}, relevantEvent.timestamp) // Save last gcd with current timestamp

				this._lastGcd.isInstant = !hasBeginCast
				this._lastGcd.event = relevantEvent

				this._castingEvent = null
				break
			}
		}

		if (events.length) {
			this.saveGcd({...this._lastGcd}, events[events.length - 1].timestamp)
		}
		this._debugLogSavedGcds()

		return events
	}

	_debugLogSavedGcds() {
		if (!DEBUG_LOG_SAVED_GCDS) {
			return
		}

		// NOTE: Please sanity-check results when changing normalise or saveGcd. Good test cases include:
		// - Attributing 1.5s and 2.2s to correct RDM melee gcds
		// - Sub-0.5s speedmod for BLM fast-casts and correct Instant/CasterTaxed flagging
		// - Correct timestamp for last event before long gaps (ie: Kefka normal)
		this.gcds.forEach((gcd) => {
			console.log(this.parser.formatTimestamp(gcd.timestamp) + ' ' + getAction(gcd.actionId).name + '[' + gcd.length +
						'|' + gcd.normalizedLength + '] Speedmod[' + gcd.speedMod + ']' +
						(gcd.isInstant ? ' Instant' : '') + (gcd.casterTaxed ? ' CasterTaxed' : ''))
		})
	}

	_onComplete() {
		const startTime = this.parser.fight.start_time

		// TODO: Look into adding items to groups? Maybe?
		this.timeline.addGroup(new Group({
			id: 'gcd',
			content: 'GCD',
			order: -99,
		}))

		this.gcds.forEach(gcd => {
			const action = getAction(gcd.actionId)
			this.timeline.addItem(new Item({
				type: 'background',
				start: gcd.timestamp - startTime,
				length: this._getGcdLength(gcd),
				group: 'gcd',
				content: <img src={action.icon} alt={action.name}/>,
			}))
		})
	}

	//saveGcd(event, isInstant) {
	saveGcd(gcdInfo, timestamp) {
		if (!gcdInfo.event) {
			return
		}

		const action = getAction(gcdInfo.event.ability.guid)
		let speedMod = this.speedmod.get(gcdInfo.event.timestamp)
		let castTime = action.castTime

		// HACK NOTE TODO: Need to properly account for abilities that alter only the cast or recast of attacks.
		// Thinking of moving this into a module like speedmod, that can be called with a timestamp to grab modified base castTime/cooldown values
		const HACK_ASTRAL_UMBRAL_SPEED_SCALAR = 0.5
		if (speedMod <= HACK_ASTRAL_UMBRAL_SPEED_SCALAR) {
			speedMod /= HACK_ASTRAL_UMBRAL_SPEED_SCALAR
			castTime *= HACK_ASTRAL_UMBRAL_SPEED_SCALAR
		}

		let isCasterTaxed = false

		// GCD is only to two decimal places, so round it there. Storing in Ms.
		// eslint-disable-next-line no-magic-numbers
		let gcdLength = Math.round((timestamp - gcdInfo.event.timestamp)/10)*10

		if (!gcdInfo.isInstant && castTime >= action.cooldown) {
			gcdLength -= CASTER_TAX
			isCasterTaxed = true
		}

		let normalizedGcd = gcdLength
		if (!gcdInfo.isInstant) {
			normalizedGcd = normalizedGcd * ((BASE_GCD / 1000) / castTime)
		}

		normalizedGcd *= (1 / speedMod)
		normalizedGcd = Math.round(normalizedGcd)

		if (action.id) {
			this.gcds.push({
				timestamp: gcdInfo.event.timestamp,
				length: gcdLength,
				normalizedLength: normalizedGcd,
				speedMod: speedMod,
				castTime: castTime,
				cooldown: action.cooldown,
				casterTaxed: isCasterTaxed,
				actionId: action.id,
				isInstant: gcdInfo.isInstant,
			})
		}
	}

	getEstimate(bound = true) {
		const gcdLength = this.gcds.length

		// If we don't have cache, need to recaculate it
		if (this._estimatedBaseGcd === null || gcdLength !== this._estimateGcdCount) {
			// Calculate the lengths of the GCD
			const lengths = this.gcds.map(gcd => gcd.normalizedLength)

			// Mode seems to get best results. Using mean in case there's multiple modes.
			this._estimatedBaseGcd = lengths.length? math.mean(math.mode(lengths)) : MAX_GCD
			this._estimateGcdCount = gcdLength
		}

		// Bound the result if requested
		if (bound) {
			this._estimatedBaseGcd = Math.max(MIN_GCD, Math.min(MAX_GCD, this._estimatedBaseGcd))
		}

		return this._estimatedBaseGcd
	}

	getUptime() {
		return this.gcds.reduce((carry, gcd) => {
			const duration = this._getGcdLength(gcd)
			const downtime = this.downtime.getDowntime(
				gcd.timestamp,
				gcd.timestamp + duration
			)
			return carry + duration - downtime
		}, 0)
	}

	_getGcdLength(gcd) {
		const cooldownRatio = this.getEstimate() / MAX_GCD

		let cd = (gcd.isInstant || gcd.castTime <= gcd.cooldown) ? gcd.cooldown : Math.max(gcd.castTime, gcd.cooldown)
		cd *= 1000

		const duration = Math.round((cd * cooldownRatio * gcd.speedMod) + (gcd.casterTaxed ? CASTER_TAX : 0))

		return duration
	}

	output() {
		const estimate = this.getEstimate(false)

		return <>
			<Message info icon>
				<Icon name="info"/>
				<Message.Content>
					<Trans id="core.gcd.no-statistics">
						Unfortunately, player statistics are not available from FF Logs. As such, the following GCD length is an <em>estimate</em>, and may well be incorrect. If it is reporting a GCD length <em>longer</em> than reality, you likely need to focus on keeping your GCD rolling.
					</Trans>
				</Message.Content>
			</Message>
			{estimate !== this.getEstimate(true) && <Message warning>
				<Icon name="warning sign"/>
				<Trans id="core.gcd.invalid-gcd">
					The estimated GCD falls outside possible GCD values, and has been bounded to {this.parser.formatDuration(this.getEstimate(true))} for calculations.
				</Trans>
			</Message>}
			<Trans id="core.gcd.estimate">
				Estimated GCD: <strong>{this.parser.formatDuration(estimate)}</strong>
			</Trans>
		</>
	}
}
