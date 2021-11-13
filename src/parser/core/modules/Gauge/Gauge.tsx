import {t} from '@lingui/macro'
import TimeLineChart from 'components/ui/TimeLineChart'
import {StatusKey} from 'data/STATUSES'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import React from 'react'
import {isDefined} from 'utilities'
import {Data} from '../Data'
import {ResourceGraphs} from '../ResourceGraphs'
import {AbstractGauge} from './AbstractGauge'
import {TimerGauge} from './TimerGauge'

const PAUSES_TIMER_GAUGE_STATUSES: StatusKey[] = [
	'TEMPORAL_DISPLACEMENT_INTERMISSION',
	'TEMPORAL_DISPLACEMENT_ENRAGE',
]

export class Gauge extends Analyser {
	static override handle = 'gauge'
	static override title = t('core.gauge.title')`Gauge`

	@dependency protected resourceGraphs!: ResourceGraphs
	@dependency protected data!: Data

	private gauges: AbstractGauge[] = []

	override initialise() {
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook({
			type: 'raise',
			actor: this.parser.actor.id,
		}, this.onRaise)

		/**
		 * Rigging up a core hook for statuses that cause timers to pause, since the TimerGauges can't do it internally.
		 * Currently this is just TEA's Temporal Displacement, but if we ever encounter another
		 * mechanic like that again in a future fight, we'll have the capability to handle it.
		 */
		const pauseTimerFilter = filter<Event>().target(this.parser.actor.id).status(this.data.matchStatusId(PAUSES_TIMER_GAUGE_STATUSES))
		this.addEventHook(pauseTimerFilter.type('statusApply'), this.onPauseTimers)
		this.addEventHook(pauseTimerFilter.type('statusRemove'), this.onResumeTimers)

		this.addEventHook('complete', () => this.gauges.forEach(gauge => gauge.generateResourceGraph()))
	}

	/** Add & initialise a gauge implementation to be tracked as part of the core gauge handling. */
	add<T extends AbstractGauge>(gauge: T) {
		gauge.setParser(this.parser)

		// TODO: Work out how to remove this. Probably also the parser, too.
		if (gauge instanceof TimerGauge) {
			gauge.setAddTimestampHook(this.addTimestampHook.bind(this))
			gauge.setRemoveTimestampHook(this.removeTimestampHook.bind(this))
		}

		gauge.setResourceGraphs(this.resourceGraphs)
		gauge.init()

		this.gauges.push(gauge)
		return gauge
	}

	protected onDeath() {
		this.gauges.forEach(gauge => gauge.reset())
	}

	protected onRaise() {
		this.gauges.forEach(gauge => gauge.raise())
	}

	private onPauseTimers() {
		this.gauges.forEach(gauge => {
			if (gauge instanceof TimerGauge) {
				if (!gauge.paused) {
					gauge.pause()
				}
			}
		})
	}

	private onResumeTimers() {
		this.gauges.forEach(gauge => {
			if (gauge instanceof TimerGauge) {
				gauge.resume()
			}
		})
	}

	override output() {
		// Generate a dataset from each registered gauge
		const datasets = this.gauges
			.map(gauge => gauge.generateDataset())
			.filter(isDefined)

		if (datasets.length < 1) {
			return false
		}

		const data = {datasets}
		return <TimeLineChart data={data}/>
	}
}
