import math from 'mathjsCustom'
import React, {Fragment} from 'react'
import {Message, Icon} from 'semantic-ui-react'
import {i18nMark, Trans} from '@lingui/react'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Group, Item} from './Timeline'

const MIN_GCD = 1500
const MAX_GCD = 2500

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

	_estimate = null
	_estimateGcdCount = -1

	unmodifiedGcds = []
	gcdsNormalizedTo2_5 = []

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
				if (this._castingEvent && this._castingEvent.ability.guid === action.id) {
					this.saveGcd(this._castingEvent, false)
				} else {
					this.saveGcd(event, true)
				}

				this._castingEvent = null
				break
			}
		}

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

		this.unmodifiedGcds.forEach(gcd => {
			const action = getAction(gcd.actionId)
			this.timeline.addItem(new Item({
				type: 'background',
				start: gcd.timestamp - startTime,
				length: gcd.length,
				group: 'gcd',
				content: <img src={action.icon} alt={action.name}/>,
			}))
		})

		/*
		this.gcdsNormalizedTo2_5.forEach(gcd => {
			const action = getAction(gcd.actionId)
			this.timeline.addItem(new Item({
				type: 'background',
				start: gcd.timestamp - startTime,
				length: this._getGcdLength(gcd),
				group: 'gcd',
				content: <img src={action.icon} alt={action.name}/>,
			}))
		})
		*/
	}

	saveGcd(event, isInstant) {
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
			const castTime = action.castTime ? action.castTime : 0 // esling-disable-line no-magic-numbers
			const cooldown = action.cooldown ? action.cooldown : 2.5 // esling-disable-line no-magic-numbers
			if (castTime >= cooldown) {
				// Caster tax. Feelsbad. TODO: Reddit link explaining it
				gcdLength -= 100
				normalizedGcdLength2_5 -= 100
				// TODO: Caster tax unmodifiedGcdLength?
				isCasterTaxed = true
				//console.log('Caster Taxing ' + action.name)
			}

			if (castTime > 2.5 && castTime !== 3.5) {
				normalizedGcdLength2_5 = normalizedGcdLength2_5 * (2.5 / castTime)
			}
		}

		// Speedmod is full length -> actual length, we want to do the opposite here
		const speedMod = this.speedmod.get(event.timestamp)
		const revSpeedMod = 1 / speedMod
		normalizedGcdLength2_5 *= revSpeedMod
		normalizedGcdLength2_5 = Math.round(normalizedGcdLength2_5)

		if (this._lastGcdGuid !== 0) {
			this.gcdsNormalizedTo2_5.push({
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

			//console.log(action.name + ': ' + gcdLength)
		}

		this._lastGcdGuid = event.ability.guid
		this._lastGcdIsInstant = isInstant

		// Store current gcd time for the check
		this._lastGcdTimestamp = event.timestamp
	}

	getEstimate(bound = true) {
		const gcdLength = this.gcdsNormalizedTo2_5.length

		let estimate = this._estimate

		// If we don't have cache, need to recaculate it
		if (estimate === null || gcdLength !== this._estimateGcdCount) {
			// Calculate the lengths of the GCD
			const lengths = this.gcdsNormalizedTo2_5.map(gcd => gcd.length)

			// Mode seems to get best results. Using mean in case there's multiple modes.
			estimate = lengths.length? math.mean(math.mode(lengths)) : MAX_GCD

			// Save the cache out
			this._estimate = estimate
			this._estimateGcdCount = gcdLength
		}

		// Bound the result if requested
		if (bound) {
			estimate = Math.max(MIN_GCD, Math.min(MAX_GCD, estimate))
		}

		return this._estimate = estimate
	}

	getUptime() {
		return this.unmodifiedGcds.reduce((carry, gcd) => {
			const duration = this._getGcdLength(gcd)// + gcd.casterTaxed ? 100 : 0
			const downtime = this.downtime.getDowntime(
				gcd.timestamp,
				gcd.timestamp + duration
			)
			return carry + duration - downtime
		}, 0)
	}

	_getGcdLength(gcd) {
		const cooldownRatio = this.getEstimate() / MAX_GCD

		const action = getAction(gcd.actionId)
		let castTime = action.castTime ? action.castTime : 0
		const cooldown = action.cooldown ? action.cooldown : 2.5

		// TODO: Complete hack. Remove and make BLM-specific
		if (castTime === 3.5 && gcd.length < 2500) {
			//console.log('FastCast')
			castTime = 1.75
		}

		let cd = (gcd.isInstant || castTime <= cooldown) ? cooldown : Math.max(castTime, cooldown)
		cd *= 1000

		const duration = (cd * cooldownRatio * gcd.speedMod) + (gcd.isCasterTaxed ? 100 : 0)

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
