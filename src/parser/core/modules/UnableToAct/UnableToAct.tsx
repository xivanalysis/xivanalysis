import Module, {dependency} from 'parser/core/Module'
import {STATUS_IDS} from './statusIds'
import {AbilityEvent, Event, AbilityType} from 'fflogs'
import {SimpleRow, Timeline, SimpleItem} from '../Timeline'
import React from 'react'
import {Data} from '../Data'

interface UTADowntime {
	depth: number
	start: number
	end: number
	applyEvents: AbilityEvent[]
	removeEvents: AbilityEvent[]
}

export default class UnableToAct extends Module {
	static handle = 'unableToAct'
	static debug = true

	@dependency private readonly data!: Data
	@dependency private readonly timeline!: Timeline

	private downtimes: UTADowntime[] = []
	private current?: UTADowntime

	protected init() {
		const filter = {abilityId: STATUS_IDS}
		this.addEventHook('applybuff', filter, this.onApply)
		this.addEventHook('applydebuff', filter, this.onApply)
		this.addEventHook('removebuff', filter, this.onRemove)
		this.addEventHook('removedebuff', filter, this.onRemove)

		this.addEventHook('complete', this.onComplete)
	}

	private onApply(event: AbilityEvent) {
		const downtime: UTADowntime = this.current || {
			depth: 0,
			start: event.timestamp,
			end: Infinity,
			applyEvents: [],
			removeEvents: [],
		}

		downtime.depth++
		downtime.applyEvents.push(event)
		this.current = downtime
	}

	private onRemove(event: AbilityEvent) {
		const downtime = this.current
		if (!downtime) { return }

		downtime.depth--
		downtime.removeEvents.push(event)

		if (downtime.depth <= 0) {
			downtime.end = event.timestamp
			this.downtimes.push(downtime)
			this.current = undefined
		}
	}

	private onComplete(event: Event) {
		// If there's a current downtime, just force clear it
		const unknown = this.data.actions.UNKNOWN
		if (this.current) {
			for (let i = this.current.depth; i > 0; i--) {
				this.onRemove({
					...event,
					ability: {
						abilityIcon: unknown.icon,
						guid: unknown.id,
						name: unknown.name,
						type: AbilityType.SPECIAL,
					},
				})
			}
		}

		this.debug(() => this.renderDebugTimelineData())
	}

	private renderDebugTimelineData() {
		const startTime = this.parser.fight.start_time
		const row = this.timeline.addRow(new SimpleRow({
			label: 'UTA Debug',
			order: -Infinity,
		}))

		this.downtimes.forEach(downtime => {
			row.addItem(new SimpleItem({
				start: downtime.start - startTime,
				end: downtime.end - startTime,
				content: <div style={{width: '100%', height: '100%', backgroundColor: '#aaf'}}/>,
			}))
		})
	}

	getDowntimes(start = 0, end = this.parser.currentTimestamp) {
		return this.downtimes.filter(downtime => downtime.end > start && downtime.start < end)
	}
}
