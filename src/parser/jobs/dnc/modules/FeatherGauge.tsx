import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import _ from 'lodash'
import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import Module, {dependency} from 'parser/core/Module'
import {AoeEvent} from 'parser/core/modules/AoE'
import Suggestions, {TieredSuggestion} from 'parser/core/modules/Suggestions'

import {GAUGE_SEVERITY_TIERS, GaugeGraphEntry} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
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
	static displayOrder = DISPLAY_ORDER.FEATHERS

	@dependency private suggestions!: Suggestions

	private feathersConsumed = 0
	private avgGenerated = 0
	private history: GaugeGraphEntry[] = [{t: 0, y: 0, isGenerator: false}]
	private currentFeathers = 0
	private featherOvercap = 0

	protected init() {
		this.addHook('aoedamage', {by: 'player', abilityId: FEATHER_GENERATORS}, this.onCastGenerator)
		this.addHook('cast', {by: 'player', abilityId: FEATHER_CONSUMERS}, this.onConsumeFeather)
		this.addHook('death', {to: 'player'}, this.onDeath)
		this.addHook('complete', this.onComplete)
	}

	public feathersSpentInRange(start: number, end: number): number {
		if (start > end) {
			return -1
		}
		return this.history.filter(event => event.t >= start - this.parser.fight.start_time && event.t <= end - this.parser.fight.start_time && !event.isGenerator).length
	}

	private onCastGenerator(event: AoeEvent) {
		if (!event.successfulHit) {
			return
		}
		this.avgGenerated += FEATHER_GENERATION_CHANCE
		this.setFeather(this.currentFeathers + FEATHER_GENERATION_CHANCE, true)
	}

	private onConsumeFeather() {
		this.feathersConsumed++

		// If we consumed a feather when we think we don't have one, clearly we do, so update the history to reflect that
		if (this.currentFeathers < 1) {
			this.correctFeatherHistory()
		}

		this.setFeather(this.currentFeathers - 1)
	}

	private correctFeatherHistory() {
		// Add the underrun amount to all events back to the previous spender so the graph shows we had enough to spend
		let lastGeneratorIndex = _.findLastIndex(this.history, event => event.isGenerator)
		lastGeneratorIndex = lastGeneratorIndex === -1 ? 0 : lastGeneratorIndex
		const underrun = 1 - this.currentFeathers
		for (let i = lastGeneratorIndex; i < this.history.length; i++) {
			this.history[i].y += underrun
		}

		// If there's nothing before the last generator, we don't need to smooth anything
		if (lastGeneratorIndex === 0) {
			return
		}

		// Find the last spender event prior to the generator event found above and linearly smooth the graph between the two events
		const prevSpenderIndex = _.findLastIndex(this.history.slice(0, lastGeneratorIndex), event => !event.isGenerator)
		const adjustmentPerEvent = underrun / (lastGeneratorIndex - prevSpenderIndex)
		for (let j = prevSpenderIndex + 1; j < lastGeneratorIndex; j ++) {
			this.history[j].y = this.history[j].y + adjustmentPerEvent * (j - prevSpenderIndex)
		}
	}

	private onDeath() {
		this.setFeather(0)
	}

	private setFeather(value: number, generationEvent: boolean = false) {
		this.currentFeathers = _.clamp(value, 0, MAX_FEATHERS)
		const t = this.parser.currentTimestamp - this.parser.fight.start_time
		this.history.push({t, y: this.currentFeathers, isGenerator: generationEvent})

		this.featherOvercap += Math.max(0, value - this.currentFeathers)
	}

	private onComplete() {
		this.featherOvercap = Math.floor(this.featherOvercap)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FAN_DANCE_III.icon,
			content: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.content">
				You may have lost uses of your <ActionLink {...ACTIONS.FAN_DANCE} />s due to using one of your procs while already holding four feathers. Make sure to use a feather with <ActionLink showIcon={false} {...ACTIONS.FAN_DANCE} /> or <ActionLink showIcon={false} {...ACTIONS.FAN_DANCE_II} /> before using a proc to prevent overcapping.
			</Trans>,
			tiers: GAUGE_SEVERITY_TIERS,
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
