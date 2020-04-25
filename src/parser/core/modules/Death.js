import React from 'react'
import {Plural, Trans} from '@lingui/react'

import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {SimpleItem} from './Timeline'

// One of these being applied to an actor signifies they're back up
const RAISE_STATUSES = [
	'WEAKNESS',
	'BRINK_OF_DEATH',
]

export default class Death extends Module {
	static handle = 'death'
	static dependencies = [
		'data',
		'suggestions',
		'timeline',
	]

	_count = 0
	_deadTime = 0
	_timestamp = null

	constructor(...args) {
		super(...args)

		const raiseStatuses = RAISE_STATUSES.map(key => this.data.statuses[key])

		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('applydebuff', {
			to: 'player',
			abilityId: raiseStatuses,
		}, this._onRaise)
		this.addHook('complete', this._onComplete)

		// If they (begin)cast, they were probably LB3'd, just mark end of death
		// TODO: I mean there's an actual LB3 action cast, it's just not in the logs because of my filter. Look into it.
		const checkLb3 = event => this._timestamp && this._onRaise(event)
		this.addHook('begincast', {by: 'player'}, checkLb3)
		this.addHook('cast', {by: 'player'}, checkLb3)
	}

	_onDeath(event) {
		if (!this.shouldCountDeath(event)) { return }

		this._count ++
		this._timestamp = event.timestamp
	}

	_onRaise(event) {
		this.addDeathToTimeline(event.timestamp)
		this.parser.fabricateEvent({
			type: 'raise',
			targetID: event.targetID,
		})
	}

	_onComplete() {
		// If the parse was a wipe, and they didn't res after their last death, refund the death - the wipe itself is
		// pretty meaningless to complain about.
		// Max at 0 because dummy parses aren't counted as kills, though.
		if (
			!this.parser.fight.kill &&
			this._timestamp
		) {
			this._count = Math.max(this._count - 1, 0)
		}

		if (this._timestamp) {
			this.addDeathToTimeline(this.parser.fight.end_time)
		}

		if (!this._count) {
			return
		}

		// Deaths are always major
		this.suggestions.add(new Suggestion({
			icon: this.data.actions.RAISE.icon,
			content: <Trans id="core.deaths.content">
				Don't die. Between downtime, lost gauge resources, and resurrection debuffs, dying is absolutely <em>crippling</em> to damage output.
			</Trans>,
			severity: SEVERITY.MORBID,
			why: <Plural
				id="core.deaths.why"
				value={this._count}
				_1="# death"
				other="# deaths"
			/>,
		}))
	}

	// Override this if a fight mechanic is a forced death *cough*ucob*cough* and shouldn't be counted towards the player
	shouldCountDeath(/* event */) {
		return true
	}

	addDeathToTimeline(end) {
		const startTime = this.parser.fight.start_time

		this.timeline.addItem(new SimpleItem({
			start: this._timestamp - startTime,
			end: end - startTime,
			// TODO: This but better?
			content: <div style={{width: '100%', height: '100%', backgroundColor: '#ce909085'}}/>,
		}))

		this._deadTime += (end - this._timestamp)
		this._timestamp = null
	}

	get deadTime() { return this._deadTime }
}
