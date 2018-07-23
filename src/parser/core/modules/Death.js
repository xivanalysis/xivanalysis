import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Item} from 'parser/core/modules/Timeline'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// One of these being applied to an actor signifies they're back up
const RAISE_STATUSES = [
	STATUSES.WEAKNESS.id,
	STATUSES.BRINK_OF_DEATH.id,
]

export default class Death extends Module {
	static handle = 'death'
	static dependencies = [
		'suggestions',
		'timeline',
	]

	_count = 0
	_timestamp = null

	constructor(...args) {
		super(...args)

		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('applydebuff', {
			to: 'player',
			abilityId: RAISE_STATUSES,
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
	}

	_onComplete() {
		if (this._timestamp) {
			this.addDeathToTimeline(this.parser.fight.end_time)
		}

		// Deaths are always major
		if (!this._count) {
			return
		}

		this.suggestions.add(new Suggestion({
			icon: ACTIONS.RAISE.icon,
			content: <Fragment>
				Don't die. Between downtime, lost gauge resources, and resurrection debuffs, dying is absolutely <em>crippling</em> to damage output.
			</Fragment>,
			severity: SEVERITY.MORBID,
			why: <Fragment>{this._count} death{this._count !== 1 && 's'}.</Fragment>,
		}))
	}

	// Override this if a fight mechanic is a forced death *cough*ucob*cough* and shouldn't be counted towards the player
	shouldCountDeath(/* event */) {
		return true
	}

	addDeathToTimeline(end) {
		const startTime = this.parser.fight.start_time
		this.timeline.addItem(new Item({
			type: 'background',
			start: this._timestamp - startTime,
			end: end - startTime,
		}))
		this._timestamp = null
	}
}
