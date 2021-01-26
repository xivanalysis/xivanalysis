import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {Data} from 'parser/core/modules/Data'
import {dependency} from '../Injectable'
import Cooldowns from './Cooldowns'
import GlobalCooldown from './GlobalCooldown'
import {SimpleRow, StatusItem} from './Timeline'

const STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS = 2 * 1000

type StatusEvent = Events['statusApply'] | Events['statusRemove']

interface StatusUsage {
	start: number,
	end?: number,
}

// Track statuses applied by actions
export default class Statuses extends Analyser {
	static handle = 'statuses'

	@dependency private cooldowns!: Cooldowns
	@dependency private data!: Data
	@dependency private gcd!: GlobalCooldown

	static statusesStackMapping = new Map<number, number>()

	private statusUsages: Map<number, StatusUsage[]> = new Map()
	private rows: Map<number, SimpleRow> = new Map()
	private statusToActionMap: Map<number, Action> = new Map()

	initialise() {
		const pets = this.parser.pull.actors.filter(actor => actor.owner === this.parser.actor)
		const ids = [this.parser.actor.id, ...pets.map(pet => pet.id)]

		ids.forEach(id => {
			this.addEventHook({type: 'statusApply', source: id}, this.onApply)
			this.addEventHook({type: 'statusRemove', source: id}, this.onRemove)
		})
		this.addEventHook('complete', this.onComplete)

		// Map statuses to actions
		Object.values(this.data.actions).forEach(action => {
			if (!action.statusesApplied) { return }
			action.statusesApplied.forEach(statusKey => {
				const status = this.data.statuses[statusKey]
				this.statusToActionMap.set(status.id, action)
			})
		})
	}

	private onApply(event: Events['statusApply']) {
		if (!this.isStatusAppliedToPet(event)) {
			return
		}

		this.addStatus(event)
	}

	private onRemove(event: Events['statusRemove']) {
		if (!this.isStatusAppliedToPet(event)) {
			return
		}

		this.endPrevStatus(event)
	}

	private addStatus(event: StatusEvent) {
		let usages = this.statusUsages.get(event.status)

		if (!usages) {
			usages = []
		}

		if (usages.some(usage => {
			const diff = Math.abs(event.timestamp - this.parser.eventTimeOffset - usage.start)
			return diff <= STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS
		})) {
			return
		}

		usages.push({
			start: event.timestamp - this.parser.eventTimeOffset,
		})
	}

	private endPrevStatus(event: StatusEvent) {
		const usages = this.statusUsages.get(event.status)

		if (usages) {
			const prev = _.last(usages)

			if (prev && !prev.end) {
				prev.end = event.timestamp - this.parser.eventTimeOffset
			}
		}
	}

	private onComplete() {
		this.statusUsages.forEach((usages, statusId) => {
			const status = this.data.getStatus(statusId)
			if (!status) { return }

			const row = this.createRowForStatus(status)
			if (!row) { return }

			usages.forEach(usage => {
				row.addItem(new StatusItem({
					status: status,
					start: usage.start,
					end: usage.end || usage.start + (status.duration ?? 0) * 1000,
				}))
			})
		})
	}

	private createRowForStatus(status: Status) {
		const key = Statuses.statusesStackMapping.get(status.id) ?? status.id
		const row = this.rows.get(key)

		if (row != null) {
			return row
		}

		// Find action for status
		const action = this.statusToActionMap.get(status.id)
		if (!action) { return undefined }

		const newRow = new SimpleRow({label: status.name, hideCollapsed: true})
		this.rows.set(key, newRow)

		const parentRow = action.onGcd
			? this.gcd.timelineRow
			: this.cooldowns.getActionTimelineRow(action)
		parentRow.addRow(newRow)

		return newRow
	}

	private isStatusAppliedToPet(event: StatusEvent) {
		return this.parser.pull.actors
			.some(actor => actor.id === event.target && actor.owner?.playerControlled)
	}
}
