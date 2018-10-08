import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
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

// Yeah they're the same duration now, but it could change...
const THUNDERCLOUD_DURATION = 18000
const FIRESTARTER_DURATION = 18000

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'castTime',
		'timeline',
		'suggestions',
	]

	_firestarter = null
	_thundercloud = false
	_castingSpell = null

	_firestarterWears = null
	_thundercloudWears = null

	_droppedT3Ps = 0
	_droppedF3Ps = 0

	_buffs = {}
	_group = null

	constructor(...args) {
		super(...args)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.THUNDERCLOUD.id,
		}, this._onRemoveThundercloud)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.FIRESTARTER.id,
		}, this._onRemoveFirestarter)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.THUNDERCLOUD.id,
		}, this._onApplyThundercloud)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.FIRESTARTER.id,
		}, this._onApplyFirestarter)
		this.addHook('refreshbuff', {
			by: 'player',
			abilityId: [STATUSES.FIRESTARTER.id, STATUSES.THUNDERCLOUD.id],
		}, this._onRefreshBuff)
		this.addHook('begincast', {
			by: 'player',
		}, this._onBeginCast)
		this.addHook('cast', {
			by: 'player',
		}, this._onCast)
		this.addHook('complete', this._onComplete)

		this._group = new Group({
			id: 'procbuffs',
			content: 'Procs',
			order: 0,
			nestedGroups: [],
		})
		this.timeline.addGroup(this._group) // Group for showing procs on the timeline
	}

	// Keep track of casts we start to help look for instant casts
	_onBeginCast(event) {
		this._castingSpell = event.ability
	}

	// Consolidate old onCast functions into one central function
	_onCast(event) {
		// Skip proc checking if we had a corresponding begincast event or the begincast we recorded isn't the same as this spell (ie. cancelled a cast, used a proc)
		if (!this._castingSpell || this._castingSpell !== event.ability) {
			if (event.ability.guid === ACTIONS.FIRE_III.id) {
				if (this._firestarter !== null) {
					event.ability.overrideAction = ACTIONS.FIRE_III_PROC
				}
			} else if (THUNDER_ACTIONS.includes(event.ability.guid)) {
				if (this._thundercloud) {
					this.castTime.set(THUNDER_ACTIONS, 0, event.timestamp, event.timestamp) // Note that this cast was 0 time
					if (event.ability.guid === ACTIONS.THUNDER_III.id) {
						event.ability.overrideAction = ACTIONS.THUNDER_III_PROC // Mark this T3 as a proc for use elsewhere
					} else if (event.ability.guid === ACTIONS.THUNDER_IV.id) {
						event.ability.overrideAction = ACTIONS.THUNDER_IV_PROC // Might as well mark out T4 procs as well...
					}
				}
			}
		}
		if (this._castingSpell) { this._castingSpell = null }
	}

	// Handle displaying this proc buff on the timeline
	applyBuff(timestamp, status) {
		const groupId = 'procbuffs-' + status.id
		if (!this._group.nestedGroups.includes(groupId)) {
			this.timeline.addGroup(new Group({
				id: groupId,
				content: status.name,
			}))
			this._group.nestedGroups.push(groupId)
		}
		this._buffs[status.id] = new Item({
			type: 'background',
			start: timestamp - this.parser.fight.start_time,
			group: groupId,
			content: <img src={status.icon} alt={status.name}/>,
		})
	}

	_onRefreshBuff(event) {
		const statusId = event.ability.guid
		// When the buff refreshes, reset the wear-off timestamp, and, for timeline display purposes, end the previous buff and start a new one
		if (statusId === STATUSES.FIRESTARTER.id) {
			this._firestarterWears = event.timestamp + FIRESTARTER_DURATION
			this.loseBuff(event.timestamp, STATUSES.FIRESTARTER)
			this.applyBuff(event.timestamp, STATUSES.FIRESTARTER)
		} else if (statusId === STATUSES.THUNDERCLOUD.id) {
			this._thundercloudWears = event.timestamp + THUNDERCLOUD_DURATION
			this.loseBuff(event.timestamp, STATUSES.THUNDERCLOUD)
			this.applyBuff(event.timestamp, STATUSES.THUNDERCLOUD)
		}
	}

	loseBuff(timestamp, status) {
		const item = this._buffs[status.id]
		// This shouldn't happen, but it do.
		if (!item) { return }

		item.end = timestamp - this.parser.fight.start_time
		this.timeline.addItem(item)
	}

	_onRemoveThundercloud(event) {
		this._thundercloud = false
		if (event.timestamp >= this._thundercloudWears) { // If this wore off because of time, note it
			this._droppedT3Ps++
		}
		this.loseBuff(event.timestamp, STATUSES.THUNDERCLOUD)
	}

	_onRemoveFirestarter(event) {
		if (this._firestarter !== null) {
			this.castTime.reset(this._firestarter)
			this._firestarter = null
		}
		if (event.timestamp >= this._firestarterWears) {
			this._droppedF3Ps++
		}
		this.loseBuff(event.timestamp, STATUSES.FIRESTARTER)
	}

	_onApplyThundercloud(event) {
		this._thundercloud = true // just save a boolean value, we'll handle the castTime information elsewhere
		this._thundercloudWears = event.timestamp + THUNDERCLOUD_DURATION // Note when this buff will wear off, to check for dropped procs
		this.applyBuff(event.timestamp, STATUSES.THUNDERCLOUD)
	}

	// Same stuff as _onApplyThundercloud, but for Firestarters
	_onApplyFirestarter(event) {
		this._firestarter = this.castTime.set([ACTIONS.FIRE_III.id], 0)
		this._firestarterWears = event.timestamp + FIRESTARTER_DURATION
		this.applyBuff(event.timestamp, STATUSES.FIRESTARTER)
	}

	_onComplete(event) {
		// Finalise buffs for timeline display
		if (this._buffs[STATUSES.FIRESTARTER.id]) {
			if (!this._buffs[STATUSES.FIRESTARTER.id].end) {
				this.loseBuff(event.timestamp, STATUSES.FIRESTARTER)
			}
		}
		if (this._buffs[STATUSES.THUNDERCLOUD.id]) {
			if (!this._buffs[STATUSES.THUNDERCLOUD.id].end) {
				this.loseBuff(event.timestamp, STATUSES.THUNDERCLOUD)
			}
		}
		// Suggestions to use procs that wore off.
		if (this._droppedT3Ps) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III_PROC.icon,
				content: <Trans id="blm.procs.suggestions.dropped-t3ps.content">
					You lost at least  one <ActionLink {...ACTIONS.THUNDER_III_PROC}/> by allowing <StatusLink {...STATUSES.THUNDERCLOUD}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-t3ps.why">
					<Plural value={this._droppedT3Ps} one="# Thundercloud was" other="# Thunderclouds were"/> expired.
				</Trans>,
			}))
		}
		if (this._droppedF3Ps) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_III_PROC.icon,
				content: <Trans id="blm.procs.suggestions.dropped-f3ps.content">
					You lost at least  one <ActionLink {...ACTIONS.FIRE_III_PROC}/> by allowing <StatusLink {...STATUSES.FIRESTARTER}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-f3ps.why">
					<Plural value={this._droppedF3Ps} one="# Firestarter was" other="# Firestarters were"/> expired.
				</Trans>,
			}))
		}
	}
}
