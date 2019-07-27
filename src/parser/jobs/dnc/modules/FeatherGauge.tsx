import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import _ from 'lodash'
import React, {Fragment} from 'react'

import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

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

	@dependency private suggestions!: Suggestions

	private feathersConsumed = 0
	private avgGenerated = 0
	private history: Array<{t: number, y: number}> = []
	private currentFeathers = 0
	private featherOvercap = 0

	protected init() {
		this.addHook('cast', {by: 'player', abilityId: FEATHER_GENERATORS}, this.onCastGenerator)
		this.addHook('cast', {by: 'player', abilityId: FEATHER_CONSUMERS}, this.onConsumeFeather)
		this.addHook('death', {to: 'player'}, this.onDeath)
		this.addHook('complete', this.onComplete)
	}
	private onCastGenerator() {
		this.avgGenerated += FEATHER_GENERATION_CHANCE
		this.setFeather(this.currentFeathers + FEATHER_GENERATION_CHANCE)
	}
	private onConsumeFeather() {
		this.feathersConsumed++
		// If we consumed a feather when we think we don't have one, clearly we do, so update the history to reflect that
		// TODO: count how many feathers have been spent since the last possible generation event and endure the history for
		// those n events is correct.
		if (this.currentFeathers < 1) {
			const prevHistory = this.history.pop()
			if (prevHistory) {
				prevHistory.y = 1
				this.history.push(prevHistory)
			}
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

		this.featherOvercap = Math.max(0, value - this.currentFeathers)
	}

	private onComplete() {
		this.featherOvercap = Math.floor(this.featherOvercap)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TECHNICAL_FINISH.icon,
			content: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.content">
				You may have lost feathers due to using one of your procs while already holding four feathers. Make sure to use a feather before using a proc.
			</Trans>,
			tiers: { // More lenient than usual due to the probable unreliability of the data.
				1: SEVERITY.MINOR,
				5: SEVERITY.MEDIUM,
				10: SEVERITY.MAJOR,
			},
			value: this.featherOvercap,
			why: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.why">
				<Plural value={this.featherOvercap} one="# feather" other="# feathers"/> may have been lost.
			</Trans>,
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
				<Trans id="dnc.feather-gauge.graph.help-text">This graph is a rough estimate of your feather gauge, at best. Take it with a hefty grain of salt.</Trans>
			</span>
				<TimeLineChart data={data} />
		</Fragment>
	}
}
