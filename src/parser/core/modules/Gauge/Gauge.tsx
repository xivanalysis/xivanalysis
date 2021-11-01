import {t} from '@lingui/macro'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {ResourceGraphs} from '../ResourceGraphs'
import {AbstractGauge} from './AbstractGauge'
import {TimerGauge} from './TimerGauge'

export class Gauge extends Analyser {
	static override handle = 'gauge'
	static override title = t('core.gauge.title')`Gauge`

	@dependency protected resourceGraphs!: ResourceGraphs

	private gauges: AbstractGauge[] = []

	protected pauseGeneration = false;

	override initialise() {
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook({
			type: 'raise',
			actor: this.parser.actor.id,
		}, this.onRaise)

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

	private onDeath() {
		this.pauseGeneration = true
		this.gauges.forEach(gauge => gauge.reset())
	}

	private onRaise() {
		this.pauseGeneration = false
		this.gauges.forEach(gauge => gauge.raise())
	}
}
