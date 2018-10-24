import ACTIONS from 'data/ACTIONS'
import STATUSES, {getStatus} from 'data/STATUSES'
import Module from 'parser/core/Module'
import React from 'react'
import {Group, Item} from 'parser/core/modules/Timeline'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'

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

// Yeah they're the same duration now, but it could change...
const BUFF_DURATIONS = {
	[STATUSES.THUNDERCLOUD.id]: 18000,
	[STATUSES.FIRESTARTER.id]: 18000,
}

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'castTime',
		'timeline',
		'suggestions',
	]

	_castingSpell = null

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

	_group = null

	constructor(...args) {
		super(...args)
		this.addHook('removebuff', {by: 'player', abilityId: PROC_BUFFS}, this._onLoseProc)
		this.addHook('applybuff', {by: 'player', abilityId: PROC_BUFFS}, this._onGainProc)
		this.addHook('refreshbuff', {by: 'player', abilityId: PROC_BUFFS}, this._onRefreshProc)
		this.addHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)

		this._group = new Group({
			id: 'procbuffs',
			content: 'Procs',
			order: 0,
			nestedGroups: [],
		})
		this.timeline.addGroup(this._group) // Group for showing procs on the timeline
	}

	_onLoseProc(event) {
		this._stopAndSave(event.ability.guid, event.timestamp)
	}

	_onGainProc(event) {
		const status = getStatus(event.ability.guid)

		if (!status) {
			return
		}

		const tracker = this._buffWindows[status.id]
		tracker.current = {
			start: event.timestamp,
			wear: event.timestamp + BUFF_DURATIONS[status.id],
		}

		const groupId = 'procbuffs-' + status.id
		if (!this._group.nestedGroups.includes(groupId)) {
			this.timeline.addGroup(new Group({
				id: groupId,
				content: status.name,
			}))
			this._group.nestedGroups.push(groupId)
		}
	}

	_onRefreshProc(event) {
		this._stopAndSave(event.ability.guid, event.timestamp)
		this._onGainProc(event)
	}

	// Keep track of casts we start to help look for instant casts
	_onBeginCast(event) {
		this._castingSpell = event.ability
	}

	// Consolidate old onCast functions into one central function
	_onCast(event) {
		// Skip proc checking if we had a corresponding begincast event or the begincast we recorded isn't the same as this spell (ie. cancelled a cast, used a proc)
		if (!this._castingSpell || this._castingSpell !== event.ability) {
			if (event.ability.guid === ACTIONS.FIRE_III.id && this._buffWindows[STATUSES.FIRESTARTER.id].current) {
				this.castTime.set([ACTIONS.FIRE_III.id], 0, event.timestamp, event.timestamp)
				event.ability.overrideAction = ACTIONS.FIRE_III_PROC
				this._stopAndSave(STATUSES.FIRESTARTER.id, event.timestamp, false) // Stop the buff and don't count is as a drop in case of latency/timing weirdness
			} else if (THUNDER_ACTIONS.includes(event.ability.guid) && this._buffWindows[STATUSES.THUNDERCLOUD.id].current) {
				this.castTime.set(THUNDER_ACTIONS, 0, event.timestamp, event.timestamp) // Note that this cast was 0 time
				if (event.ability.guid === ACTIONS.THUNDER_III.id) {
					event.ability.overrideAction = ACTIONS.THUNDER_III_PROC // Mark this T3 as a proc for use elsewhere
				} else if (event.ability.guid === ACTIONS.THUNDER_IV.id) {
					event.ability.overrideAction = ACTIONS.THUNDER_IV_PROC // Might as well mark out T4 procs as well...
				}
				this._stopAndSave(STATUSES.THUNDERCLOUD.id, event.timestamp, false)
			}
		}
		if (this._castingSpell) { this._castingSpell = null }
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
		if (tracker.current.stop >= tracker.current.wear && countDrops) {
			this._droppedProcs[statusId]++
		}
		tracker.history.push(tracker.current)
		tracker.current = null
	}

	_onComplete() {
		// Finalise buffs for timeline display
		if (this._buffWindows[STATUSES.THUNDERCLOUD.id].current) {
			this._stopAndSave(STATUSES.THUNDERCLOUD.id)
		}
		if (this._buffWindows[STATUSES.FIRESTARTER.id].current) {
			this._stopAndSave(STATUSES.FIRESTARTER.id)
		}

		PROC_BUFFS.forEach(buff => {
			const status = getStatus(buff)
			const groupId = 'procbuffs-' + status.id
			const fightStart = this.parser.fight.start_time

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
