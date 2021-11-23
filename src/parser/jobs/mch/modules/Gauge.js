import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

// Constants
const MAX_GAUGE = 100

const GCD_HEAT_GAIN = 5
const BARREL_STABILIZER_HEAT_GAIN = 50
const HYPERCHARGE_HEAT_COST = 50

const CLEAN_SHOT_BATTERY_GAIN = 10
const AIR_ANCHOR_BATTERY_GAIN = 20

export default class Gauge extends Module {
	static handle = 'gauge'
	static title = t('mch.gauge.title')`Heat & Battery Gauge`
	static dependencies = [
		'brokenLog',
		'suggestions',
	]

	_gauge = {
		heat: {
			current: 0,
			waste: 0,
			history: [],
		},
		battery: {
			current: 0,
			waste: 0,
			history: [],
		},
	}

	_lastQueenCost = 0

	constructor(...args) {
		super(...args)
		this.addEventHook('combo', {by: 'player', abilityId: [ACTIONS.SLUG_SHOT.id, ACTIONS.CLEAN_SHOT.id, ACTIONS.HEATED_SLUG_SHOT.id, ACTIONS.HEATED_CLEAN_SHOT.id]}, () => this._addGauge('heat', GCD_HEAT_GAIN))
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.SPLIT_SHOT.id, ACTIONS.HEATED_SPLIT_SHOT.id, ACTIONS.SPREAD_SHOT.id]}, () => this._addGauge('heat', GCD_HEAT_GAIN))
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.BARREL_STABILIZER.id}, () => this._addGauge('heat', BARREL_STABILIZER_HEAT_GAIN))
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.HYPERCHARGE.id}, this._onOverheat)

		this.addEventHook('combo', {by: 'player', abilityId: [ACTIONS.CLEAN_SHOT.id, ACTIONS.HEATED_CLEAN_SHOT.id]}, this._onCleanShot)
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.HOT_SHOT.id, ACTIONS.AIR_ANCHOR.id]}, this._onAirAnchor)
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.ROOK_AUTOTURRET.id, ACTIONS.AUTOMATON_QUEEN.id]}, this._onQueen)

		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	_pushToHistory(type) {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this._gauge[type].history.push({t: timestamp, y: this._gauge[type].current})
	}

	_addGauge(type, amount) {
		const gauge = this._gauge[type]
		gauge.current += amount
		if (gauge.current >= MAX_GAUGE) {
			gauge.waste += (gauge.current - MAX_GAUGE)
			gauge.current = MAX_GAUGE
		}

		this._pushToHistory(type)
	}

	_onOverheat() {
		if (this._gauge.heat.current < HYPERCHARGE_HEAT_COST) {
			this.brokenLog.trigger(this, 'negative heat', (
				<Trans id="mch.gauge.trigger.negative-heat">
					<ActionLink {...ACTIONS.HYPERCHARGE}/> was used when the simulated Heat gauge was at {this._gauge.heat.current}.
				</Trans>
			))
		}

		this._gauge.heat.current = Math.max(this._gauge.heat.current - HYPERCHARGE_HEAT_COST, 0)
		this._pushToHistory('heat')
	}

	_onCleanShot() {
		this._addGauge('battery', CLEAN_SHOT_BATTERY_GAIN)
	}

	_onAirAnchor() {
		this._addGauge('battery', AIR_ANCHOR_BATTERY_GAIN)
	}

	_onQueen() {
		this._lastQueenCost = this._gauge.battery.current
		this._gauge.battery.current = 0
		this._pushToHistory('battery')
	}

	_onDeath() {
		this._gauge.heat.current = 0
		this._gauge.battery.current = 0
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HYPERCHARGE.icon,
			content: <Trans id="mch.gauge.suggestions.heat-waste.content">
				Try not to let your Heat gauge overcap, as it may cost you Overheat windows over the course of the fight.
			</Trans>,
			tiers: {
				// TODO - Proper tiers
				5: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				75: SEVERITY.MAJOR,
			},
			value: this._gauge.heat.waste,
			why: <Trans id="mch.gauge.suggestions.heat-waste.why">
				You lost {this._gauge.heat.waste} Heat to an overcapped gauge.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.AUTOMATON_QUEEN.icon,
			content: <Trans id="mch.gauge.suggestions.battery-waste.content">
				Try not to let your Battery gauge overcap, as it may cost you <ActionLink {...ACTIONS.AUTOMATON_QUEEN}/> uses over the course of the fight.
			</Trans>,
			tiers: {
				// TODO - Proper tiers
				10: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				50: SEVERITY.MAJOR,
			},
			value: this._gauge.battery.waste,
			why: <Trans id="mch.gauge.suggestions.battery-waste.why">
				You lost {this._gauge.battery.waste} Battery to an overcapped gauge.
			</Trans>,
		}))
	}

	output() {
		const heatColor = Color('#D35A10')
		const batteryColor = Color('#2C9FCB')

		/* eslint-disable @typescript-eslint/no-magic-numbers */
		const chartdata = {
			datasets: [
				{
					label: 'Heat',
					steppedLine: true,
					data: this._gauge.heat.history,
					backgroundColor: heatColor.fade(0.8).toString(),
					borderColor: heatColor.fade(0.5).toString(),
				},
				{
					label: 'Battery',
					steppedLine: true,
					data: this._gauge.battery.history,
					backgroundColor: batteryColor.fade(0.8).toString(),
					borderColor: batteryColor.fade(0.5).toString(),
				},
			],
		}
		/* eslint-enable @typescript-eslint/no-magic-numbers */

		const options = {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						min: 0,
						max: 100,
					},
				}],
			},
		}

		return <Fragment>
			<TimeLineChart
				data={chartdata}
				options={options}
			/>
		</Fragment>
	}

	lastQueenCost() { return this._lastQueenCost }
}