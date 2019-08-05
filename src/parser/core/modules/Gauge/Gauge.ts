import {t} from '@lingui/macro'
import {DeathEvent} from 'fflogs'
import Module from 'parser/core/Module'
import {AbstractGauge} from './AbstractGauge'

export class Gauge extends Module {
	static handle = 'gauge'
	static title = t('core.gauge.title')`Gauge`

	private gauges: AbstractGauge[] = []

	protected init() {
		this.addHook('death', {to: 'player'}, this.onDeath)
	}

	/** Add & initialise a gauge implementation to be tracked as part of the core gauge handling. */
	add(gauge: AbstractGauge) {
		gauge.setGetTimestamp(this.getTimestamp)
		this.gauges.push(gauge)
	}

	private onDeath(event: DeathEvent) {
		this.gauges.forEach(gauge => gauge.reset())
	}

	private getTimestamp = () => this.parser.currentTimestamp
}
