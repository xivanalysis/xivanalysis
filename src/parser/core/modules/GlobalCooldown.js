import math from 'mathjsCustom'
import React, {Fragment} from 'react'
import {Message, Icon} from 'semantic-ui-react'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Group, Item} from './Timeline'

const MIN_GCD = 1500
const MAX_GCD = 2500

export default class GlobalCooldown extends Module {
	static handle = 'gcd'
	static dependencies = [
		'precastAction', // We need this to normalise before us
		'speedmod',
		'timeline',
	]
	static title = 'Global Cooldown'

	_lastGcd = -1
	_castingEvent = null

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
					this.saveGcd(this._castingEvent)
				} else {
					this.saveGcd(event)
				}

				this._castingEvent = null
				break
			}
		}

		return events
	}

	_onComplete() {
		const gcdLength = this.getEstimate()
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
				length: gcdLength,
				group: 'gcd',
				content: <img src={action.icon} alt={action.name}/>,
			}))
		})
	}

	saveGcd(event) {
		let gcdLength = -1

		if (this._lastGcd >= 0) {
			// GCD is only to two decimal places, so round it there. Storing in Ms.
			gcdLength = Math.round((event.timestamp - this._lastGcd)/10)*10
		}

		// Speedmod is full length -> actual length, we want to do the opposite here
		const revSpeedMod = 1/this.speedmod.get(event.timestamp)
		gcdLength *= revSpeedMod

		this.gcds.push({
			timestamp: event.timestamp,
			length: gcdLength,
			actionId: event.ability.guid,
		})

		// Store current gcd time for the check
		this._lastGcd = event.timestamp
	}

	getEstimate(bound = true) {
		// TODO: THIS WILL BREAK ON BLM 'CUS F4's CAST IS LONGER THAN THE GCD

		// TODO: /analyse/jgYqcMxtpDTCX264/8/50/
		//       Estimate is 2.31, actual is 2.35. High Arrow uptime.

		// If there's no GCDs, just return the max to stop this erroring out
		if (!this.gcds.length) {
			return MAX_GCD
		}

		// Calculate the lengths of the GCD
		const lengths = this.gcds.map(gcd => gcd.length)

		// Mode seems to get best results. Using mean in case there's multiple modes.
		let estimate = math.mean(math.mode(lengths))

		// Bound the result if requested
		if (bound) {
			estimate = Math.max(MIN_GCD, Math.min(MAX_GCD, estimate))
		}

		return estimate
	}

	output() {
		const estimate = this.getEstimate(false)

		return <Fragment>
			<Message info icon>
				<Icon name="info"/>
				<Message.Content>
					Unfortunately, player statistics are not available from FF Logs. As such, the following GCD length is an <em>estimate</em>, and may well be incorrect. If it is reporting a GCD length <em>longer</em> than reality, you likely need to focus on keeping your GCD rolling.
				</Message.Content>
			</Message>
			{estimate !== this.getEstimate(true) && <Message warning>
				<Icon name="warning sign"/>
				The estimated GCD falls outside possible GCD values, and has been bounded to {this.parser.formatDuration(this.getEstimate(true))} for calculations.
			</Message>}
			Estimated GCD: <strong>{this.parser.formatDuration(estimate)}</strong>
		</Fragment>
	}
}
