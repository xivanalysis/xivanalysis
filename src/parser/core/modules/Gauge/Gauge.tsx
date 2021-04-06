import {t} from '@lingui/macro'
import TimeLineChart from 'components/ui/TimeLineChart'
import Module, {dependency} from 'parser/core/Module'
import React from 'react'
import {isDefined} from 'utilities'
import {ResourceGraphs} from '../ResourceGraphs'
import {AbstractGauge} from './AbstractGauge'
import {TimerGauge} from './TimerGauge'

export class Gauge extends Module {
	static handle = 'gauge'
	static title = t('core.gauge.title')`Gauge`

	@dependency private resourceGraphs!: ResourceGraphs

	private gauges: AbstractGauge[] = []

	protected init() {
		this.addEventHook('death', {to: 'player'}, this.onDeath)
	}

	/** Add & initialise a gauge implementation to be tracked as part of the core gauge handling. */
	add<T extends AbstractGauge>(gauge: T) {
		gauge.setParser(this.parser)

		// TODO: Work out how to remove this. Probably also the parser, too.
		if (gauge instanceof TimerGauge) {
			gauge.setAddTimestampHook(this.addTimestampHook.bind(this))
			gauge.setRemoveTimestampHook(this.removeTimestampHook.bind(this))
		}

		this.gauges.push(gauge)
		return gauge
	}

	private onDeath() {
		this.gauges.forEach(gauge => gauge.reset())
	}

	output() {
		// Generate a resource graph on the timeline for each registered gauge
		this.gauges
			.map(gauge => gauge.generateResourceDataset())
			.filter(isDefined)
			.forEach(resource => this.resourceGraphs.addResource(resource))

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
