import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {SimpleRow, StatusItem} from 'parser/core/modules/Timeline'

const PROC_STATUSES = [
	STATUSES.FLOURISHING_FAN_DANCE.id,
	STATUSES.FLOURISHING_CASCADE.id,
	STATUSES.FLOURISHING_FOUNTAIN.id,
	STATUSES.FLOURISHING_SHOWER.id,
	STATUSES.FLOURISHING_WINDMILL.id,
]

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'downtime',
		'suggestions',
		'timeline',
	]

	_casts = { //the listing order is arbitrary
		[ACTIONS.FAN_DANCE_III.id]: 0,
		[ACTIONS.REVERSE_CASCADE.id]: 0,
		[ACTIONS.FOUNTAINFALL.id]: 0,
		[ACTIONS.BLOODSHOWER.id]: 0,
		[ACTIONS.RISING_WINDMILL.id]: 0,
	}
	_removedProcs = {
		[STATUSES.FLOURISHING_FAN_DANCE.id]: 0,
		[STATUSES.FLOURISHING_CASCADE.id]: 0,
		[STATUSES.FLOURISHING_FOUNTAIN.id]: 0,
		[STATUSES.FLOURISHING_SHOWER.id]: 0,
		[STATUSES.FLOURISHING_WINDMILL.id]: 0,
	}

	_buffWindows = {
		[STATUSES.FLOURISHING_FAN_DANCE.id]: {
			current: null,
			history: [],
		},
		[STATUSES.FLOURISHING_CASCADE.id]: {
			current: null,
			history: [],
		},
		[STATUSES.FLOURISHING_FOUNTAIN.id]: {
			current: null,
			history: [],
		},
		[STATUSES.FLOURISHING_SHOWER.id]: {
			current: null,
			history: [],
		},
		[STATUSES.FLOURISHING_WINDMILL.id]: {
			current: null,
			history: [],
		},
	}
	_row = null
	_rows = new Map()

	_overwrittenProcs = 0
	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {by: 'player', abilityId: Object.keys(this._casts).map(Number)}, this._onCast)
		this.addEventHook('applybuff', {by: 'player', abilityId: PROC_STATUSES}, this._onProcGained)
		this.addEventHook('refreshbuff', {by: 'player', abilityId: PROC_STATUSES}, this._procOverwritten)
		this.addEventHook('removebuff', {by: 'player', abilityId: PROC_STATUSES}, this._onProcRemoved)
		this.addEventHook('complete', this._onComplete)

		this._row = this.timeline.addRow(new SimpleRow({
			label: 'Procs',
			order: 0,
		}))
	}

	_onCast(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._casts[event.ability.guid]++
		}
	}
	_onProcGained(event) {
		const statusId = event.ability.guid
		const tracker = this._buffWindows[statusId]

		if (!tracker) {
			return
		}

		tracker.current = {
			start: event.timestamp,
		}
	}
	_procOverwritten() {
		this._overwrittenProcs++
	}
	_onProcRemoved(event) {
		this._stopAndSave(event.ability.guid, event.timestamp)
	}

	_onComplete() { // tracking dropped procs
		const droppedFan_Dance = this._removedProcs[STATUSES.FLOURISHING_FAN_DANCE.id] - this._casts[ACTIONS.FAN_DANCE_III.id]
		const droppedCascade = this._removedProcs[STATUSES.FLOURISHING_CASCADE.id] - this._casts[ACTIONS.REVERSE_CASCADE.id]
		const droppedFountain = this._removedProcs[STATUSES.FLOURISHING_FOUNTAIN.id] - this._casts[ACTIONS.FOUNTAINFALL.id]
		const droppedShower = this._removedProcs[STATUSES.FLOURISHING_SHOWER.id] - this._casts[ACTIONS.BLOODSHOWER.id]
		const droppedWindmill = this._removedProcs[STATUSES.FLOURISHING_WINDMILL.id] - this._casts[ACTIONS.RISING_WINDMILL.id]
		const droppedProcs = droppedWindmill + droppedShower + droppedFan_Dance + droppedCascade + droppedFountain
		this.suggestions.add(new TieredSuggestion({ //dropped procs
			icon: ACTIONS.FOUNTAINFALL.icon,
			content: <Trans id="dnc.procs.suggestions.drops.content">
				Avoid dropping your procs unless absolutely necessary. If you have to drop one to keep your Esprit from overcapping, <ActionLink {...ACTIONS.RISING_WINDMILL} /> or <ActionLink {...ACTIONS.REVERSE_CASCADE} /> will lose the least DPS overall.
			</Trans>,
			why: <Trans id="dnc.procs.suggestions.drops.why">
				You dropped <Plural value={droppedProcs} one="# proc" other="# procs"/>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: droppedProcs,
		}))

		this.suggestions.add(new TieredSuggestion({ //overriding
			icon: ACTIONS.REVERSE_CASCADE.icon,
			content: <Trans id="dnc.procs.suggestions.overwrite.content">
				Avoid overwriting your procs. Your proc actions are stronger than your normal combo, so overwriting them is a significant DPS loss.
			</Trans>,
			why: <Trans id="dnc.procs.suggestions.overwrite.why">
							You overwrote <Plural value={this._overwrittenProcs} one="# proc" other="# procs"/>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._overwrittenProcs,
		}))

		PROC_STATUSES.forEach(buff => {
			const status = getDataBy(STATUSES, 'id', buff)
			const row = this.getRowForStatus(status)
			const fightStart = this.parser.fight.start_time

			// Finalise the buff if it was still active
			if (this._buffWindows[buff].current) {
				this._stopAndSave(buff, this.parser.fight.end_time)
			}

			// Add buff windows to the timeline
			this._buffWindows[buff].history.forEach(window => {
				row.addItem(new StatusItem({
					status,
					start: window.start - fightStart,
					end: window.stop - fightStart,
				}))
			})
		})
	}

	_stopAndSave(statusId, timestamp) {
		if (!this.downtime.isDowntime(timestamp)) {
			this._removedProcs[statusId]++
		}

		// If this proc is active, stop the buff window
		const tracker = this._buffWindows[statusId]

		if (!tracker.current) {
			return
		}

		tracker.current.stop = timestamp
		tracker.history.push(tracker.current)
		tracker.current = null
	}

	getRowForStatus(status) {
		let row = this._rows.get(status.id)
		if (row == null) {
			row = this._row.addRow(new SimpleRow({label: status.name}))
			this._rows.set(status.id, row)
		}
		return row
	}
}
