import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from '../Analyser'
import {filter, noneOf, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {ActionTimeline} from './ActionTimeline'
import {Actor, Actors} from './Actors'
import {Data} from './Data'
import {SimpleRow, StatusItem} from './Timeline'

interface Usage {
	start: number
	end?: number
}

interface StatusTarget {
	usages: Usage[]
	row: SimpleRow
}

export class StatusTimeline extends Analyser {
	static override handle = 'statusTimeline'

	static statusesStackMapping: Record<number, number> = {}

	@dependency private actionTimeline!: ActionTimeline;
	@dependency private actors!: Actors;
	@dependency private data!: Data

	private statusActionMap = new Map<Status['id'], Action>();
	private usages = new Map<Status['id'], Map<Actor['id'], StatusTarget>>()
	private rows = new Map<string, SimpleRow>()

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
		let statusUsages = this.usages.get(event.status)
		if (statusUsages == null) {
			statusUsages = new Map()
			this.usages.set(event.status, statusUsages)
		}

		let statusTarget = statusUsages.get(event.target)
		if (statusTarget == null) {
			const row = this.createStatusTargetRow(event.status, event.target)
			if (row == null) { return }
			statusTarget = {
				usages: [],
				row,
			}
			statusUsages.set(event.target, statusTarget)
		}

		// If there's an existing usage on the target, this can be considered to be a refresh
		const lastUsage = _.last(statusTarget.usages)
		if (lastUsage != null && lastUsage.end == null) {
			return
		}

		statusTarget.usages.push({
			start: event.timestamp,
		})
	}

	private onRemove(event: Events['statusRemove']) {
		const lastUsage = _.last(this.usages.get(event.status)?.get(event.target)?.usages)
		if (lastUsage == null) { return }

		lastUsage.end = event.timestamp
	}

	private onComplete() {
		for (const [statusId, statusUsages] of this.usages) {
			const status = this.data.getStatus(statusId)
			if (status == null) { continue }

			for (const statusTarget of statusUsages.values()) {
				for (const usage of statusTarget.usages) {
					statusTarget.row.addItem(new StatusItem({
						status,
						start: usage.start - this.parser.pull.timestamp,
						end: (usage.end ?? this.parser.pull.timestamp + this.parser.pull.duration) - this.parser.pull.timestamp,
					}))
				}
			}
		}
	}

	private createStatusTargetRow(statusId: Status['id'], targetId: Actor['id']) {
		const mapping = (this.constructor as typeof StatusTimeline).statusesStackMapping
		const remappedStatusId = mapping[statusId] ?? statusId

		const rowKey = this.getRowKey(remappedStatusId, targetId)

		const cachedRow = this.rows.get(rowKey)
		if (cachedRow != null) { return cachedRow }

		const statusRow = this.createStatusRow(remappedStatusId)
		if (statusRow == null) { return }

		const actor = this.actors.get(targetId)

		const row = statusRow.addRow(new SimpleRow({
			label: actor.name,
		}))

		this.rows.set(rowKey, row)
		return row
	}

	private createStatusRow(statusId: Status['id']) {
		const rowKey = this.getRowKey(statusId)

		const cachedRow = this.rows.get(rowKey)
		if (cachedRow != null) { return cachedRow }

		const action = this.statusActionMap.get(statusId)
		if (action == null) { return }

		const row = this.actionTimeline.getRow(action).addRow(new SimpleRow({
			label: this.data.getStatus(statusId)?.name ?? statusId,
			hideCollapsed: true,
			collapse: true,
		}))

		this.rows.set(rowKey, row)
		return row
	}

	private getRowKey = (statusId: Status['id'], targetId?: Actor['id']) =>
		`${statusId}:${targetId}`
}
