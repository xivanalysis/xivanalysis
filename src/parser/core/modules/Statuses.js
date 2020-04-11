import Module from 'parser/core/Module'
import {SimpleRow, StatusItem} from './Timeline'

const STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS = 2 * 1000

// Track statuses applied by actions
export default class Statuses extends Module {
	static handle = 'statuses'
	static dependencies = [
		'cooldowns',
		'data',
		'gcd',
	]

	static statusesStackMapping = {}

	_statuses = {}
	_groups = {}
	_rows = {}
	_statusToActionMap = {}
	_actionToMergeNameMap = {}

	constructor(...args) {
		super(...args)

		const ids = [this.parser.player.id, ...this.parser.player.pets.map(p => p.id)]
		const byFilter = {by: ids}

		this.addHook('complete', this._onComplete)
		this.addHook(['applybuff', 'applydebuff'], byFilter, this._onApply)
		this.addHook(['refreshdebuff', 'refreshbuff'], byFilter, this._onRefresh)
		this.addHook(['removebuff', 'removedebuff'], byFilter, this._onRemove)

		this.cooldowns.constructor.cooldownOrder.forEach(cd => {
			if (cd && typeof cd === 'object' && cd.merge) {
				cd.actions.forEach(ac => {
					this._actionToMergeNameMap[ac] = cd.name
				})
			}
		})

		// Map statuses to actions
		Object.values(this.data.actions).forEach(action => {
			if (!action.statusesApplied) { return }
			action.statusesApplied.forEach(statusKey => {
				const status = this.data.statuses[statusKey]
				this._statusToActionMap[status.id] = action
			})
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
		const status = this.data.getStatus(event.ability.guid)

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
		const status = this.data.getStatus(event.ability.guid)

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
			const row = this._createRowForStatus(entry.status)
			if (row == null) { return }

			entry.usages.forEach(st => {
				row.addItem(new StatusItem({
					status: entry.status,
					start: st.start,
					end: st.end || st.start + entry.status.duration * 1000,
				}))
			})
		})
	}

	_createRowForStatus(status) {
		const key = this.constructor.statusesStackMapping[status.id] ?? status.id

		if (this._rows[key] != null) {
			return this._rows[key]
		}

		// find action for status
		const action = this._statusToActionMap[status.id]
		if (!action) { return undefined }

		const row = new SimpleRow({label: status.name, hideCollapsed: true})
		this._rows[key] = row

		const parentRow = action.onGcd
			? this.gcd.timelineRow
			: this.cooldowns.getActionTimelineRow(action)
		parentRow.addRow(row)

		return row
	}

	_isStatusAppliedToPet(event) {
		return (this.parser.report.friendlyPets.some(p => p.id === event.targetID))
	}
}
