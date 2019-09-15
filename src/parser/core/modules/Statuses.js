import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {ItemGroup, Item} from './Timeline'
import {getDataBy} from 'data'
import React from 'react'

const STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS = 2 * 1000

// Track statuses applied by actions
export default class Statuses extends Module {
	static handle = 'statuses'
	static dependencies = [
		'timeline',
		// need this module to be executed after gcd to have gcd group created in timeline
		'cooldowns', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'gcd', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	static statusesStackMapping = {}

	_statuses = {}
	_groups = {}
	_statusToActionMap = {}
	_actionToMergeNameMap = {}

	constructor(...args) {
		super(...args)

		const ids = [this.parser.player.id, ...this.parser.player.pets]
		const byFilter = {by: ids}

		this.addHook('complete', this._onComplete)
		this.addHook(['applybuff', 'applydebuff'], byFilter, this._onApply)
		this.addHook(['refreshdebuff', 'refreshbuff'], byFilter, this._onRefresh)
		this.addHook(['removebuff', 'removedebuff'], byFilter, this._onRemove)

		this.cooldowns.constructor.cooldownOrder.forEach(it => {
			if (typeof it === 'object' && it.merge) {
				it.actions.forEach(ac => {
					this._actionToMergeNameMap[ac] = it.name
				})
			}
		})

		// Map statuses to actions
		Object.values(ACTIONS).forEach(ac => {
			if (ac.statusesApplied) {
				ac.statusesApplied.forEach(st => {
					if (st) {
						this._statusToActionMap[st.id] = ac.id
					}
				})
			}
		})
	}

	_onApply(event) {
		if (this._isStatusAppliedToPet(event)) {
			return
		}

		this._addStatus(event)
	}

	_onRefresh(event) {
		if (this._isStatusAppliedToPet(event)) {
			return
		}

		this._endPrevStatus(event)

		this._addStatus(event)
	}

	_onRemove(event) {
		if (this._isStatusAppliedToPet(event)) {
			return
		}

		this._endPrevStatus(event)
	}

	_endPrevStatus(event) {
		const status = getDataBy(STATUSES, 'id', event.ability.guid)

		if (!status) {
			return
		}

		const statusEntry = this._statuses[status.id]
		if (statusEntry) {
			const prev = statusEntry.usages[statusEntry.usages.length - 1]
			if (!prev.end) {
				prev.end = event.timestamp - this.parser.fight.start_time
			}
		}
	}

	_addStatus(event) {
		const status = getDataBy(STATUSES, 'id', event.ability.guid)

		if (!status) {
			return
		}

		let statusEntry = this._statuses[status.id]
		if (!statusEntry) {
			statusEntry = this._statuses[status.id] = {
				status: status,
				usages: [],
			}
		}
		if (statusEntry.usages.some(it => {
			const diff = Math.abs(event.timestamp - this.parser.fight.start_time - it.start)
			return diff <= STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS
		})) {
			return
		}

		statusEntry.usages.push({
			start: event.timestamp - this.parser.fight.start_time,
		})
	}

	_onComplete() {
		Object.values(this._statuses).forEach(entry => {
			const group = this._createGroupForStatus(entry.status)

			if (!group) {
				return
			}

			entry.usages.forEach(st => {
				group.addItem(new Item({
					type: 'background',
					start: st.start,
					end: st.end || st.start + entry.status.duration * 1000,
					content: <img src={entry.status.icon} alt={entry.status.name}/>,
				}))
			})
		})
	}

	_createGroupForStatus(status) {
		const stid = 'status-' + (this.constructor.statusesStackMapping[status.id] || status.id)

		if (this._groups[stid]) {
			return this._groups[stid]
		}

		// find action for status
		const action = getDataBy(ACTIONS, 'id', this._statusToActionMap[status.id])

		if (!action) {
			return undefined
		}

		const group = new ItemGroup({
			id: stid,
			content: status.name,
			showNested: false,
		})

		this._groups[stid] = group

		this.timeline.attachToGroup(action.onGcd ? 'gcd' : (this._actionToMergeNameMap[action.id] || action.id), group)

		return group
	}

	_isStatusAppliedToPet(event) {
		return (this.parser.report.friendlyPets.some(p => p.id === event.targetID))
	}
}
