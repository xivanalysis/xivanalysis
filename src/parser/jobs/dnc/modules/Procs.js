import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Group, Item} from 'parser/core/modules/Timeline'

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
	_group = null

	_overwrittenProcs = 0
	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player', abilityId: Object.keys(this._casts).map(Number)}, this._onCast)
		this.addHook('applybuff', {by: 'player', abilityId: PROC_STATUSES}, this._onProcGained)
		this.addHook('refreshbuff', {by: 'player', abilityId: PROC_STATUSES}, this._procOverwritten)
		this.addHook('removebuff', {by: 'player', abilityId: PROC_STATUSES}, this._onProcRemoved)
		this.addHook('complete', this._onComplete)

		this._group = new Group({
			id: 'procbuffs',
			content: 'Procs',
			order: 0,
			nestedGroups: [],
		})
		this.timeline.addGroup(this._group) // Group for showing procs on the timeline
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
				Avoid dropping your procs unless absolutely necessary, as doing so leads to a DPS loss unless under very specific circumstances. If you have to drop one to keep your Esprit from overcapping, <ActionLink {...ACTIONS.RISING_WINDMILL} /> will lose the least DPS overall.
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
			const groupId = this.getGroupIdForStatus(status)
			const fightStart = this.parser.fight.start_time

			// Finalise the buff if it was still active
			if (this._buffWindows[buff].current) {
				this._stopAndSave(buff, this.parser.fight.end_time)
			}

			// Add buff windows to the timeline
			this._buffWindows[buff].history.forEach(window => {
				this.timeline.addItem(new Item({
					type: 'background',
					start: window.start - fightStart,
					end: window.stop - fightStart,
					group: groupId,
					content: <img src={status.icon} alt={status.name}/>,
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

	getGroupIdForStatus(status) {
		const groupId = 'procbuffs-' + status.id

		// Make sure a timeline group exists for this buff
		if (!this._group.nestedGroups.includes(groupId)) {
			this.timeline.addGroup(new Group({
				id: groupId,
				content: status.name,
			}))
			this._group.nestedGroups.push(groupId)
		}

		return groupId
	}
}
