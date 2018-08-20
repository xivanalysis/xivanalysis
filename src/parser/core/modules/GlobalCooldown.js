import math from 'mathjsCustom'
import React, {Fragment} from 'react'
import {Message, Icon} from 'semantic-ui-react'
import {i18nMark, Trans} from '@lingui/react'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Group, Item} from './Timeline'

const MIN_GCD_IN_MILLIS = 1500
const MAX_GCD_IN_MILLIS = 2500
const BASE_GCD_IN_SECONDS = 2.5
const CASTER_TAX_IN_MILLIS = 100

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

	_lastGcdTimestamp = -1
	_castingEvent = null

	_lastGcdIsInstant = false
	_lastGcdGuid = 0

	_estimatedBaseGcd = null
	_estimateGcdCount = -1

	_lastGcd = {}
	gcds = []

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)
	}

	// Using normalise so the estimate can be used throughout the parse
	normalise(events) {
		this._lastGcd.timestamp = this.parser.fight.start_time

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
				if (this._castingEvent && this._castingEvent.ability.guid === action.id) {
					this.saveGcd(this._castingEvent, false)
				} else {
					this.saveGcd(event, true)
				}

				this._castingEvent = null
				break
			}
		}

		this.saveGcd(events[events.length - 1])

		return events
	}

	_onComplete() {
		const startTime = this.parser.fight.start_time

		// TODO: Look into adding items to groups? Maybe?
		this.timeline.addGroup(new Group({
			id: 'gcd',
			content: 'GCD',
			order: 1,
		}))

		this.gcds.forEach(gcd => {
			const action = getAction(gcd.actionId)
			this.timeline.addItem(new Item({
				type: 'background',
				start: gcd.timestamp - startTime,
				length: gcd.length,
				group: 'gcd',
				content: <img src={action.icon} alt={action.name}/>,
			}))
		})
	}

	saveGcd(event, isInstant) {
		const action = getAction(this._lastGcd.guid)

		let isCasterTaxed = false

		// GCD is only to two decimal places, so round it there. Storing in Ms.
		// eslint-disable-next-line no-magic-numbers
		const gcdLength = Math.round((event.timestamp - this._lastGcd.timestamp)/10)*10

		if (!isInstant && action.castTime >= action.cooldown) {
			isCasterTaxed = true
		}

		const speedMod = this.speedmod.get(event.timestamp)

		if (action.id) {
			this.gcds.push({
				timestamp: event.timestamp,
				length: gcdLength,
				normalizedLength: gcdLength,
				speedMod: this._lastGcd.speedMod,
				casterTaxed: isCasterTaxed,
				actionId: action.id,
				isInstant: this._lastGcd.isInstant,
			})

			const lastGcdPushed = this.gcds[this.gcds.length - 1]
			console.log(this.parser.formatTimestamp(lastGcdPushed.timestamp) + ' ' + getAction(lastGcdPushed.actionId).name +
						'[' + lastGcdPushed.length + '] Speedmod[' + lastGcdPushed.speedMod + ']' + (lastGcdPushed.isInstant ? ' INSTANT' : ''))
		}

		this._lastGcd.isInstant = isInstant
		this._lastGcd.guid = event.ability.guid
		this._lastGcd.timestamp = event.timestamp
		this._lastGcd.speedMod = speedMod

		/*
		let gcdLength = -1
		let unmodifiedGcdLength = -1
		let normalizedGcdLength2_5 = -1

		const action = getAction(this._lastGcdGuid)
		let isCasterTaxed = false

		if (this._lastGcdTimestamp >= 0) {
			gcdLength = event.timestamp - this._lastGcdTimestamp
			// GCD is only to two decimal places, so round it there. Storing in Ms.
			// eslint-disable-next-line no-magic-numbers
			gcdLength = Math.round((event.timestamp - this._lastGcdTimestamp)/10)*10
			unmodifiedGcdLength = gcdLength
			normalizedGcdLength2_5 = gcdLength
		}

		if (!this._lastGcdIsInstant) {
			const castTime = action.castTime ? action.castTime : 0
			const cooldown = action.cooldown ? action.cooldown : BASE_GCD_IN_SECONDS
			if (castTime >= cooldown) {
				gcdLength -= CASTER_TAX_IN_MILLIS
				normalizedGcdLength2_5 -= CASTER_TAX_IN_MILLIS
				// TODO: Caster tax unmodifiedGcdLength?
				isCasterTaxed = true
				//console.log('Caster Taxing ' + action.name)
			}

			//			if (castTime > BASE_GCD_IN_SECONDS && castTime !== 3.5) {
			normalizedGcdLength2_5 = normalizedGcdLength2_5 * (BASE_GCD_IN_SECONDS / castTime)
			//			}
		}

		// Speedmod is full length -> actual length, we want to do the opposite here
		const speedMod = this.speedmod.get(this._lastGcdTimestamp >= 0 ? this._lastGcdTimestamp : event.timestamp)
		const revSpeedMod = 1 / speedMod
		normalizedGcdLength2_5 *= revSpeedMod
		normalizedGcdLength2_5 = Math.round(normalizedGcdLength2_5)

		if (this._lastGcdGuid !== 0) {
			this.gcdsNormalizedToBase.push({
				timestamp: event.timestamp,
				length: normalizedGcdLength2_5,
				speedMod,
				casterTaxed: isCasterTaxed,
				actionId: this._lastGcdGuid,
				isInstant: this._lastGcdIsInstant,
			})

			this.unmodifiedGcds.push({
				timestamp: event.timestamp,
				length: unmodifiedGcdLength,
				speedMod,
				casterTaxed: isCasterTaxed,
				actionId: this._lastGcdGuid,
				isInstant: this._lastGcdIsInstant,
			})

			//console.log(action.name + '[' + gcdLength + '] Speedmod[' + speedMod + ']' + ' Time[' + this.parser.formatTimestamp(event.timestamp) + ']')
		}

		this._lastGcdGuid = event.ability.guid
		this._lastGcdIsInstant = isInstant

		// Store current gcd time for the check
		this._lastGcdTimestamp = event.timestamp
		*/
	}

	getEstimate(bound = true) {
		const gcdLength = this.gcds.length

		// If we don't have cache, need to recaculate it
		if (this._estimatedBaseGcd === null || gcdLength !== this._estimateGcdCount) {
			// Calculate the lengths of the GCD
			const lengths = this.gcds.map(gcd => gcd.normalizedLength)

			// Mode seems to get best results. Using mean in case there's multiple modes.
			this._estimatedBaseGcd = lengths.length? math.mean(math.mode(lengths)) : MAX_GCD_IN_MILLIS
			this._estimateGcdCount = gcdLength
		}

		// Bound the result if requested
		if (bound) {
			this._estimatedBaseGcd = Math.max(MIN_GCD_IN_MILLIS, Math.min(MAX_GCD_IN_MILLIS, this._estimatedBaseGcd))
		}

		return this._estimatedBaseGcd
	}

	getUptime() {
		// TODO NOTE: Used by ABC module to get uptime percent. getUptime/fightDuration
		return this.gcds.reduce((carry, gcd) => {
			const duration = this._getGcdLength(gcd)// + gcd.casterTaxed ? CASTER_TAX_IN_MILLIS : 0
			const downtime = this.downtime.getDowntime(
				gcd.timestamp,
				gcd.timestamp + duration
			)
			return carry + duration - downtime
		}, 0)
	}

	_getGcdLength(gcd) {
		// TODO NOTE: Return the theoretical length of the given gcd, based on our gcd estimate. Is this supposed to take speedmod into account?
		const cooldownRatio = this.getEstimate() / MAX_GCD_IN_MILLIS

		const action = getAction(gcd.actionId)
		const castTime = action.castTime ? action.castTime : 0
		const cooldown = action.cooldown ? action.cooldown : BASE_GCD_IN_SECONDS

		let cd = (gcd.isInstant || castTime <= cooldown) ? cooldown : Math.max(castTime, cooldown)
		cd *= 1000

		const duration = (cd * cooldownRatio * gcd.speedMod) + (gcd.isCasterTaxed ? CASTER_TAX_IN_MILLIS : 0)

		/*
		let cd = (gcd.isInstant ? cooldown : Math.max(cooldown, castTime)) * 1000

		// If the cast time of the skill has been reduced beneath the GCD, cap it at max - it'll be adjusted below.
		if (this.castTime.forAction(gcd.actionId, gcd.timestamp) < MAX_GCD) {
			cd = MAX_GCD
		}

		const duration = (cd || MAX_GCD) * cooldownRatio * gcd.speedMod
		*/

		//console.log(action.name + ': ' + duration)

		return duration
	}

	output() {
		const estimate = this.getEstimate(false)

		return <Fragment>
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
		</Fragment>
	}
}
