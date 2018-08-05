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
		'castTime',
		'downtime',
		'speedmod',
		'timeline',
	]

	static i18n_id = i18nMark('core.gcd.title')
	static title = 'Global Cooldown'

	_lastGcd = -1
	_castingEvent = null

	_lastGcdIsInstant = false

	_estimate = null
	_estimateGcdCount = -1

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

	saveGcd(event, isInstant) {
		let gcdLength = -1

		if (this._lastGcd >= 0) {
			// GCD is only to two decimal places, so round it there. Storing in Ms.
			// eslint-disable-next-line no-magic-numbers
			gcdLength = Math.round((event.timestamp - this._lastGcd)/10)*10
		}

		// Speedmod is full length -> actual length, we want to do the opposite here
		const speedMod = this.speedmod.get(event.timestamp)
		const revSpeedMod = 1 / speedMod
		gcdLength *= revSpeedMod
		gcdLength = Math.round(gcdLength)

		this.gcds.push({
			timestamp: event.timestamp,
			length: gcdLength,
			speedMod,
			actionId: event.ability.guid,
			isInstant: this._lastGcdIsInstant,
		})

		this._lastGcdIsInstant = isInstant

		// Store current gcd time for the check
		this._lastGcd = event.timestamp
	}

	getEstimate(bound = true) {
		const gcdLength = this.gcds.length

		let estimate = this._estimate

		// If we don't have cache, need to recaculate it
		if (estimate === null || gcdLength !== this._estimateGcdCount) {
			// Calculate the lengths of the GCD
			// TODO: Ideally don't explicitly check only instants and 2.5s casts. Being able to use 2.8s casts would give tons more samples to consider for more accurate values
			let lengths = this.gcds.map(gcd => {
				const action = getAction(gcd.actionId)
				if (gcd.isInstant || action.castTime <= (MAX_GCD/1000)) {
					return gcd.length
				}
			})
			lengths = lengths.filter(n => n)

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

		const action = getAction(gcd.actionId)
		let cd = (gcd.isInstant ? action.cooldown : Math.max(action.cooldown, action.castTime)) * 1000

		// If the cast time of the skill has been reduced beneath the GCD, cap it at max - it'll be adjusted below.
		if (this.castTime.forAction(gcd.actionId, gcd.timestamp) < MAX_GCD) {
			cd = MAX_GCD
		}

		const duration = (cd || MAX_GCD) * cooldownRatio * gcd.speedMod

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
