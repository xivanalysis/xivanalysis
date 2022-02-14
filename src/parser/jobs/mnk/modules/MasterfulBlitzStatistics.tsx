import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import {Data} from 'parser/core/modules/Data'
import {DataSet, PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

interface TrackedAction {
	color: string,
	count: number,
}

export class MasterfulBlitzStatistics extends Analyser {
	static override handle = 'mbstats'
	static override title = t('mnk.mbstats.title')`Masterful Blitz`

	@dependency private cooldownDowntime!: CooldownDowntime
	@dependency private data!: Data
	@dependency private statistics!: Statistics

	private trackedActions: Map<number, TrackedAction> = new Map<number, TrackedAction>();

	override initialise() {
		this.trackedActions.set(this.data.actions.PHANTOM_RUSH.id, {color: '#9b6c6c', count: 0})
		this.trackedActions.set(this.data.actions.RISING_PHOENIX.id, {color: '#d59b54', count: 0})
		this.trackedActions.set(this.data.actions.ELIXIR_FIELD.id, {color: '#7b90c5', count: 0})
		this.trackedActions.set(this.data.actions.CELESTIAL_REVOLUTION.id, {color: '#8d85a6', count: 0})

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action'),
			(event) => this.onActionEvent(event.action))
		this.addEventHook('complete', this.onComplete)
	}

	private onActionEvent(actionId: number) {
		const trackedAction = this.trackedActions.get(actionId)
		if (trackedAction == null) {
			return
		}
		trackedAction.count += 1
	}

	private onComplete() {
		const data: DataSet<React.ReactNode, 2> = Array.from(this.trackedActions.entries()).map((val) => {
			const actionId: number = val[0]
			const trackedAction: TrackedAction = val[1]
			return {
				value: trackedAction.count,
				color: trackedAction.color,
				columns: [
					<ActionLink key={actionId} id={actionId}/>,
					trackedAction.count,
				],
			}
		})

		this.statistics.add(new PieChartStatistic({
			headings: [
				<ActionLink key="mnk.mbstats.headings.action" action="MASTERFUL_BLITZ"/>,
				<Trans key="mnk.mbstats.headings.count" id="mnk.mbstats.headings.count">Count</Trans>,
			],
			data: data,
		}))
	}
}
