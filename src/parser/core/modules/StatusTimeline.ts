import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from '../Analyser'
import {filter, noneOf, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {ActionTimeline} from './ActionTimeline'
import {Data} from './Data'
import {SimpleRow, StatusItem} from './Timeline'

const STATUS_APPLY_ON_PARTY_THRESHOLD = 2 * 1000

interface Usage {
	start: number
	end?: number
}

export class StatusTimeline extends Analyser {
	static override handle = 'statusTimeline'

	@dependency private actionTimeline!: ActionTimeline;
	@dependency private data!: Data

	private statusActionMap = new Map<number, Action>();
	private usages = new Map<number, Usage[]>()
	private rows = new Map<number, SimpleRow>()

	override initialise() {
		// Hook status events
		const playerPetIds = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(pet => pet.id)

		const allPetIds = this.parser.pull.actors
			.filter(actor => actor.owner?.playerControlled === true)
			.map(pet => pet.id)

		const actorFilter = filter<Event>()
			.source(oneOf([this.parser.actor.id, ...playerPetIds]))
			.target(noneOf(allPetIds))

		/*this.parser.pull.actors.some(
		actor => actor.id === event.target && actor.owner?.playerControlled === true
		)*/

		this.addEventHook(actorFilter.type('statusApply'), this.onApply)
		this.addEventHook(actorFilter.type('statusRemove'), this.onRemove)
		this.addEventHook('complete', this.onComplete)

		// Pre-cache status->action mappings
		for (const action of Object.values(this.data.actions)) {
			if (action.statusesApplied == null) { continue }
			for (const status of action.statusesApplied) {
				const statusId = this.data.statuses[status].id
				this.statusActionMap.set(statusId, action)
			}
		}
	}

	private onApply(event: Events['statusApply']) {
		let usages = this.usages.get(event.status)
		if (usages == null) {
			usages = []
			this.usages.set(event.status, usages)
		}

		// If there was another application of this status within a short time frame, it can be assumed to be multiple applies from a single action, and can be ignored.
		if (usages.some(usage =>
			Math.abs(event.timestamp - this.parser.pull.timestamp - usage.start)
			<= STATUS_APPLY_ON_PARTY_THRESHOLD
		)) {
			return
		}

		usages.push({
			start: event.timestamp - this.parser.pull.timestamp,
		})
	}

	private onRemove(event: Events['statusRemove']) {
		const usages = this.usages.get(event.status)
		if (usages == null) { return }

		const last = _.last(usages)
		if (last == null || last.end != null) { return }

		last.end = event.timestamp - this.parser.pull.timestamp
	}

	private onComplete() {
		for (const [statusId, usages] of this.usages) {
			const status = this.data.getStatus(statusId)
			if (status == null) { continue }

			const row = this.createStatusRow(status)
			if (row == null) { continue }

			for (const usage of usages) {
				row.addItem(new StatusItem({
					status,
					start: usage.start,
					end: usage.end ?? usage.start + (status.duration ?? 0) * 1000,
				}))
			}
		}
	}

	private createStatusRow(status: Status) {
		const cachedRow = this.rows.get(status.id)
		if (cachedRow != null) { return cachedRow }

		const action = this.statusActionMap.get(status.id)
		if (action == null) { return }

		const row = new SimpleRow({
			label: status.name,
			hideCollapsed: true,
		})
		this.rows.set(status.id, row)

		this.actionTimeline.getRow(action).addRow(row)

		return row
	}
}
