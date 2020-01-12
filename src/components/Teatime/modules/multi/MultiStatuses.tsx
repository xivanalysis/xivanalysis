import {Status} from 'data/STATUSES'
import {Actor, BuffEvent, Event} from 'fflogs'
import Combatant from 'parser/core/Combatant'
import Enemy from 'parser/core/Enemy'
import Entity from 'parser/core/Entity'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Enemies from 'parser/core/modules/Enemies'

// Minimum time between buffs?
const STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS = 2 * 1000

interface BuffPairs {
	start: BuffEvent,
	end?: BuffEvent,
}

interface StatusUsage {
	status: Status,
	usages: BuffPairs[],
}

interface EntityStatuses {
	entity: Entity,
	statusUsage: {[key: number]: StatusUsage},
}

export default class MultiStatuses extends Module {
	static handle = 'multiStatuses'

	@dependency private data!: Data
	@dependency private enemies!: Enemies
	@dependency private combatants!: Combatants

	private entityStatuses: {[key: number]: EntityStatuses} = {}

	protected init() {
		const byFilter = {}
		this.addHook('complete', this.onComplete)
		this.addHook(['applybuff', 'applydebuff'], byFilter, this.onApply)
		this.addHook(['refreshdebuff', 'refreshbuff'], byFilter, this.onRefresh)
		this.addHook(['removebuff', 'removedebuff'], byFilter, this.onRemove)
	}

	getStatuses(entityID: number, timestamp: Event['timestamp']): Status[] {
		const entityStatus = this.entityStatuses[entityID]
		if (!entityStatus) {
			return []
		}
		return Object.values(entityStatus.statusUsage).filter(statusEntry => (
			statusEntry.usages.some(buffPair => {
				if (buffPair.start.timestamp <= timestamp) {
					if (buffPair.end) {
						return buffPair.end.timestamp >= timestamp
					}
					return true
				}
				return false
			})
		)).map(statusUsage => statusUsage.status)
	}

	private onComplete() {
		// KC: Do something with all these buffs?
		return false
	}

	private onApply(event: BuffEvent) {
		if (this.isStatusAppliedToPet(event)) {
			return
		}

		this.addStatus(event)
	}

	private onRefresh(event: BuffEvent) {
		if (this.isStatusAppliedToPet(event)) {
			return
		}

		this.endPrevStatus(event)
		this.addStatus(event)
	}

	private onRemove(event: BuffEvent) {
		if (this.isStatusAppliedToPet(event)) {
			return
		}

		this.endPrevStatus(event)
	}

	private addStatus(event: BuffEvent) {
		const status = this.data.getStatus(event.ability.guid)

		if (!status) {
			return
		}

		if (!event.targetID) {
			return
		}

		// Whole bunch of get or creates
		let entityStatus = this.entityStatuses[event.targetID]
		if (!entityStatus) {
			const enemy: Enemy = this.enemies.getEntity(event.targetID)
			if (enemy) {
				entityStatus = this.entityStatuses[event.targetID] = {
					entity: enemy,
					statusUsage: {},
				}
			} else {
				// Friendlies
				const combatant: Combatant = this.combatants.getEntity(event.targetID)
				if (combatant) {
					entityStatus = this.entityStatuses[event.targetID] = {
						entity: combatant,
						statusUsage: {},
					}
				} else {
					// We don't know who the target is
					return
				}
			}
		}
		let statusEntry = entityStatus.statusUsage[status.id]
		if (!statusEntry) {
			statusEntry = entityStatus.statusUsage[status.id] = {
				status,
				usages: [],
			}
		}

		// KC: Original has a check for minimum status time before pushing to usages?
		if (statusEntry.usages.some(buffPairs => {
			const diff = Math.abs(event.timestamp - buffPairs.start.timestamp)
			return diff <= STATUS_APPLY_ON_PARTY_THRESHOLD_MILLISECONDS
		})) {
			return
		}

		statusEntry.usages.push({
			start: event,
		})
	}

	private endPrevStatus(event: BuffEvent) {
		const status = this.data.getStatus(event.ability.guid)

		if (!status) {
			return
		}

		if (!event.targetID) {
			return
		}

		const entityStatus = this.entityStatuses[event.targetID]
		if (entityStatus) {
			const statusEntry = entityStatus.statusUsage[status.id]
			if (statusEntry) {
				const prev = statusEntry.usages[statusEntry.usages.length - 1]
				if (!prev.end) {
					prev.end = event
				}
			}
		}

	}

	private isStatusAppliedToPet(event: BuffEvent) {
		return (this.parser.report.friendlyPets.some(p => p.id === event.targetID))
	}
}
