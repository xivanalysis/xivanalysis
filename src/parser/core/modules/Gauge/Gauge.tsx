import {t} from '@lingui/macro'
import TimeLineChart from 'components/ui/TimeLineChart'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import React from 'react'
import {isDefined} from 'utilities'
import {ResourceGraphs} from '../ResourceGraphs'
import {AbstractGauge} from './AbstractGauge'
import {TimerGauge} from './TimerGauge'

export class Gauge extends Analyser {
	static override handle = 'gauge'
	static override title = t('core.gauge.title')`Gauge`

	@dependency protected resourceGraphs!: ResourceGraphs

	private gauges: AbstractGauge[] = []

	override initialise() {
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)

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

		this.gauges.push(gauge)
		return gauge
	}

	private onDeath() {
		this.gauges.forEach(gauge => gauge.reset())
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
