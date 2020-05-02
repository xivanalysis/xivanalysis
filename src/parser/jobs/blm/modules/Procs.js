import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import React from 'react'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {SimpleRow, StatusItem} from 'parser/core/modules/Timeline'
import _ from 'lodash'

// TODO: Very certain this doesn't catch all procs correctly
// Use DEBUG_LOG_ALL_FIRE_COUNTS to display procs more easily and figure out why some aren't flagged correctly

const THUNDER_ACTIONS = [
	ACTIONS.THUNDER.id,
	ACTIONS.THUNDER_II.id,
	ACTIONS.THUNDER_III.id,
	ACTIONS.THUNDER_IV.id,
]

const PROC_BUFFS = [
	STATUSES.THUNDERCLOUD.id,
	STATUSES.FIRESTARTER.id,
]

const STATUS_DURATION_MILLIS = {
	[STATUSES.THUNDERCLOUD.id]: STATUSES.THUNDERCLOUD.duration * 1000,
	[STATUSES.FIRESTARTER.id]: STATUSES.FIRESTARTER.duration * 1000,
}

const ACTION_PROCS = {
	[ACTIONS.FIRE_III.id]: ACTIONS.FIRE_III_PROC,
	[ACTIONS.THUNDER_III.id]: ACTIONS.THUNDER_III_PROC,
	[ACTIONS.THUNDER_IV.id]: ACTIONS.THUNDER_IV_PROC,
}

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'castTime',
		'suggestions',
		'timeline',
	]

	_castingSpellId = null

	_buffWindows = {
		[STATUSES.THUNDERCLOUD.id]: {
			current: null,
			history: [],
		},
		[STATUSES.FIRESTARTER.id]: {
			current: null,
			history: [],
		},
	}

	_droppedProcs = {
		[STATUSES.THUNDERCLOUD.id]: 0,
		[STATUSES.FIRESTARTER.id]: 0,
	}

	_rows = new Map()
	_row = null

	constructor(...args) {
		super(...args)
		this.addEventHook('removebuff', {by: 'player', abilityId: PROC_BUFFS}, this._onLoseProc)
		this.addEventHook('applybuff', {by: 'player', abilityId: PROC_BUFFS}, this._onGainProc)
		this.addEventHook('refreshbuff', {by: 'player', abilityId: PROC_BUFFS}, this._onRefreshProc)
		this.addEventHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)

		this._row = this.timeline.addRow(new SimpleRow({
			label: 'Procs',
			order: 0,
		}))
	}

	getRowForStatus(status) {
		let row = this._rows.get(status.id)
		if (row == null) {
			row = this._row.addRow(new SimpleRow({label: status.name}))
			this._rows.set(status.id, row)
		}
		return row
	}

	checkProc(event, statusId) {
		const tracker = this._buffWindows[statusId]
		if (tracker.history.length > 0) {
			const lastHistoryEntry = _.last(tracker.history).stop
			return event.timestamp === lastHistoryEntry
		}
	}

	_onLoseProc(event) {
		this._stopAndSave(event.ability.guid, event.timestamp)
	}

	_onGainProc(event) {
		const statusId = event.ability.guid
		const tracker = this._buffWindows[statusId]

		tracker.current = {
			start: event.timestamp,
		}
	}

	_onRefreshProc(event) {
		this._stopAndSave(event.ability.guid, event.timestamp)
		this._onGainProc(event)
	}

	// Keep track of casts we start to help look for instant casts
	_onBeginCast(event) {
		this._castingSpellId = event.ability.guid
	}

	// Consolidate old onCast functions into one central function
	_onCast(event) {
		const actionId = event.ability.guid

		// Skip proc checking if we had a corresponding begincast event or the begincast we recorded isn't the same as this spell (ie. cancelled a cast, used a proc)
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (action && action.onGcd && (!this._castingSpellId || this._castingSpellId !== actionId)) {
			this._tryConsumeProc(event)
		}

		this._castingSpellId = null
	}

	_tryConsumeProc(event) {
		const actionId = event.ability.guid
		const statusId = this._getAffectingProcId(actionId)

		// If this action isn't affected by a proc (or something is wrong), bail out
		if (!statusId) {
			return
		}

		// If this proc is active, consume it
		if (this._buffWindows[statusId].current) {
			// Procs have 0 cast time
			this.castTime.set([actionId], 0, event.timestamp, event.timestamp)
			// Set overrideAction if we're tracking it for this spell
			if (ACTION_PROCS[actionId]) {
				event.ability.overrideAction = ACTION_PROCS[actionId]
			}
			// Stop the buff window, and ensure it's not marked as a drop
			this._stopAndSave(statusId, event.timestamp, false)
		}
	}

	_getAffectingProcId(actionId) {
		if (THUNDER_ACTIONS.includes(actionId)) {
			return STATUSES.THUNDERCLOUD.id
		}
		if (actionId === ACTIONS.FIRE_III.id) {
			return STATUSES.FIRESTARTER.id
		}
		return null
	}

	_onDeath(event) {
		this._stopAndSave(STATUSES.THUNDERCLOUD.id, event.timestamp)
		this._stopAndSave(STATUSES.FIRESTARTER.id, event.timestamp)
	}

	_stopAndSave(statusId, endTime = this.parser.currentTimestamp, countDrops = true) {
		const tracker = this._buffWindows[statusId]

		if (!tracker.current) {
			return
		}

		tracker.current.stop = endTime
		if (tracker.current.stop - tracker.current.start >= STATUS_DURATION_MILLIS[statusId] && countDrops) {
			this._droppedProcs[statusId]++
		}
		tracker.history.push(tracker.current)
		tracker.current = null
	}

	_onComplete() {
		PROC_BUFFS.forEach(buff => {
			const status = getDataBy(STATUSES, 'id', buff)
			const row = this.getRowForStatus(status)
			const fightStart = this.parser.fight.start_time

			// Finalise the buff if it was still active
			if (this._buffWindows[buff].current) {
				this._stopAndSave(buff)
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

		// Suggestions to use procs that wore off.
		if (this._droppedProcs[STATUSES.THUNDERCLOUD.id]) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III_PROC.icon,
				content: <Trans id="blm.procs.suggestions.dropped-t3ps.content">
					You lost at least one <ActionLink {...ACTIONS.THUNDER_III}/> proc by allowing <StatusLink {...STATUSES.THUNDERCLOUD}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-t3ps.why">
					<Plural value={this._droppedProcs[STATUSES.THUNDERCLOUD.id]} one="# Thundercloud proc" other="# Thundercloud procs"/> expired.
				</Trans>,
			}))
		}
		if (this._droppedProcs[STATUSES.FIRESTARTER.id]) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_III_PROC.icon,
				content: <Trans id="blm.procs.suggestions.dropped-f3ps.content">
					You lost at least  one <ActionLink {...ACTIONS.FIRE_III}/> proc by allowing <StatusLink {...STATUSES.FIRESTARTER}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-f3ps.why">
					<Plural value={this._droppedProcs[STATUSES.FIRESTARTER.id]} one="# Firestarter proc" other="# Firestarter procs"/> expired.
				</Trans>,
			}))
		}
	}
}
