import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import _ from 'lodash'
import React, {Fragment} from 'react'

import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import Module, {dependency} from 'parser/core/Module'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'

import styles from './DNCGauges.module.css'

const FEATHER_GENERATORS = [
	ACTIONS.REVERSE_CASCADE.id,
	ACTIONS.FOUNTAINFALL.id,
	ACTIONS.RISING_WINDMILL.id,
	ACTIONS.BLOODSHOWER.id,
]

const FEATHER_CONSUMERS = [
	ACTIONS.FAN_DANCE.id,
	ACTIONS.FAN_DANCE_II.id,
]

const FEATHER_GENERATION_CHANCE = .5
const MAX_FEATHERS = 4

export default class FeatherGauge extends Module {
	static handle = 'feathergauge'
	static title = t('dnc.feather-gauge.title')`Feather Gauge`

	@dependency private statistics!: Statistics

	private feathersConsumed = 0
	private avgGenerated = 0
	private history: any[] = []
	private currentFeathers = 0

	protected init() {
		this.addHook('cast', {by: 'player', abilityId: FEATHER_GENERATORS}, this.onCastGenerator)
		this.addHook('cast', {by: 'player', abilityId: FEATHER_CONSUMERS}, this.onConsumeFeather)
		this.addHook('death', {to: 'player'}, this.onDeath)
		this.addHook('complete', this.onComplete)
	}
	private onCastGenerator() {
		this.avgGenerated+=FEATHER_GENERATION_CHANCE
		this.setFeather(this.currentFeathers + FEATHER_GENERATION_CHANCE)
	}
	private onConsumeFeather() {
		this.feathersConsumed++
		// If we consumed a feather when we think we don't have one, clearly we do, so update the history to reflect that
		if (this.currentFeathers < 1) {
			const prevHistory = this.history.pop()
			prevHistory.y = 1
			this.history.push(prevHistory)
		}
		this.setFeather(this.currentFeathers - 1)
	}
	private onDeath() {
		this.setFeather(0)
	}
	private setFeather(value: number) {
		this.currentFeathers = _.clamp(value, 0, MAX_FEATHERS)
		const t = this.parser.currentTimestamp - this.parser.fight.start_time
		this.history.push({t, y: this.currentFeathers})
	}

	private onComplete() {
		this.statistics.add(new SimpleStatistic({
			title: 'Feather Ratio',
			icon: ACTIONS.FAN_DANCE_III.icon,
			value: (this.avgGenerated/this.feathersConsumed).toFixed(2),
		}))
	}

	output() {
		const dncColor = Color(JOBS.DANCER.colour)

		// tslint:disable:no-magic-numbers
		const data = {
			datasets: [{
				label: 'Feathers',
				data: this.history,
				steppedLine: true,
				backgroundColor: dncColor.fade(0.8),
				borderColor: dncColor.fade(0.5),
			}],
		}
		// tslint:enable:no-magic-numbers

		return <Fragment>
		<span className={styles.helpText}>
			<Trans id="dnc.feather-gauge.graph.help-text">This graph is a rough estimate of feathers at best. It's not able to be definitive, but it can help you spot general trends.</Trans>
		</span>
			<TimeLineChart data={data} />
		</Fragment>
	}
}
