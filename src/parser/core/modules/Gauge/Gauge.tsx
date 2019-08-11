import {t} from '@lingui/macro'
import TimeLineChart from 'components/ui/TimeLineChart'
import {DeathEvent} from 'fflogs'
import Module from 'parser/core/Module'
import React from 'react'
import {isDefined} from 'utilities'
import {AbstractGauge} from './AbstractGauge'

export class Gauge extends Module {
	static handle = 'gauge'
	static title = t('core.gauge.title')`Gauge`

	private gauges: AbstractGauge[] = []

	protected init() {
		this.addHook('death', {to: 'player'}, this.onDeath)
	}

	/** Add & initialise a gauge implementation to be tracked as part of the core gauge handling. */
	add<T extends AbstractGauge>(gauge: T) {
		gauge.setParser(this.parser)
		this.gauges.push(gauge)
		return gauge
	}

	private onDeath(event: DeathEvent) {
		this.gauges.forEach(gauge => gauge.reset())
	}

	output() {
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
