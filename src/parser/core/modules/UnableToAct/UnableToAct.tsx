import Module, {dependency} from 'parser/core/Module'
import {STATUS_IDS} from './statusIds'
import {AbilityEvent} from 'fflogs'
import {SimpleRow, Timeline, SimpleItem} from '../Timeline'
import React from 'react'
import {CompleteEvent} from 'parser/core/Parser'

interface UTADowntime {
	depth: number
	start: number
	end: number
	applyEvents: AbilityEvent[]
	removeEvents: Array<AbilityEvent | CompleteEvent>
}

export default class UnableToAct extends Module {
	static handle = 'unableToAct'
	static debug = false

	@dependency private readonly timeline!: Timeline

	private downtimes: UTADowntime[] = []
	private current?: UTADowntime

	protected init() {
		const filter = {abilityId: STATUS_IDS, to: 'player'} as const
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

	private onRemove(event: AbilityEvent | CompleteEvent) {
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

	private onComplete(event: CompleteEvent) {
		// If there's a current downtime, just force clear it
		if (this.current) {
			for (let i = this.current.depth; i > 0; i--) {
				this.onRemove(event)
			}
		}

		this.debug(() => this.renderDebugTimelineData())
	}

	private renderDebugTimelineData() {
		const startTime = this.parser.eventTimeOffset
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
