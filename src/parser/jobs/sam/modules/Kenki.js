import Color from 'color'
import React from 'react'
import _ from 'lodash'

import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
// import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const MAX_KENKI = 100

const KENKI_ACTIONS = {
	// single target
	[ACTIONS.HAKAZE.id]: {cast: 5},
	[ACTIONS.JINPU.id]: {combo: 5},
	[ACTIONS.SHIFU.id]: {combo: 5},
	[ACTIONS.YUKIKAZE.id]: {combo: 10},
	[ACTIONS.GEKKO.id]: {combo: 5, positional: 5},
	[ACTIONS.KASHA.id]: {combo: 5, positional: 5},
	[ACTIONS.AGEHA.id]: {cast: 10}, // cast 10, kill 20

	// aoe
	[ACTIONS.FUGA.id]: {cast: 5},
	[ACTIONS.MANGETSU.id]: {combo: 10},
	[ACTIONS.OKA.id]: {combo: 10},

	// ranged
	[ACTIONS.ENPI.id]: {cast: 10},

	// spenders
	[ACTIONS.HISSATSU_GYOTEN.id]: {cast: -10},
	[ACTIONS.HISSATSU_YATEN.id]: {cast: -10},
	[ACTIONS.HISSATSU_SEIGAN.id]: {cast: -15},
	[ACTIONS.HISSATSU_KAITEN.id]: {cast: -20},
	[ACTIONS.HISSATSU_SHINTEN.id]: {cast: -25},
	[ACTIONS.HISSATSU_KYUTEN.id]: {cast: -25},
	[ACTIONS.HISSATSU_GUREN.id]: {cast: -50},
}

const KENKI_PER_MEDITATE_TICK = 10
const MEDITATE_TICK_FREQUENCY = 3000
const MAX_MEDITATE_TICKS = 5

export default class Kenki extends Module {
	static handle = 'kenki'
	static dependencies = [
		// 'suggestions',
	]
	static displayOrder = -100

	// Kenki
	_kenki = {
		min: 0,
		max: 0,
	}
	_history = {
		min: [],
		max: [],
	}

	// _wasted = 0

	constructor(...args) {
		super(...args)

		// Kenki actions
		this.addHook(
			['cast', 'combo'],
			{by: 'player', abilityId: Object.keys(KENKI_ACTIONS).map(Number)},
			this._onAction,
		)

		// Meditate
		const filter = {by: 'player', abilityId: STATUSES.MEDITATE.id}
		this.addHook('applybuff', filter, this._onApplyMeditate)
		this.addHook('removebuff', filter, this._onRemoveMeditate)

		// Death just flat out resets everything. Stop dying.
		this.addHook('death', {to: 'player'}, () => this.modify(-MAX_KENKI))

		// Misc
		this.addHook('complete', this._onComplete)
	}

	// kenki quick maths
	modify(known, potential = 0) {
		this._kenki.min = _.clamp(this._kenki.min + known, 0, MAX_KENKI)
		this._kenki.max = _.clamp(this._kenki.max + known + potential, 0, MAX_KENKI)

		// TODO: Calc diff between clamped min and baseline
		// TODO: Diff shows minimum wrongnessnessness, backtrack and adjust?

		// TODO: Warn waste somehow
		// this._wasted += Math.max(0, kenki - this._kenki)

		const t = this.parser.currentTimestamp - this.parser.fight.start_time
		this._history.min.push({t, y: this._kenki.min})
		this._history.max.push({t, y: this._kenki.max})
	}

	_onAction(event) {
		const action = KENKI_ACTIONS[event.ability.guid]

		if (!action | !action[event.type]) {
			return
		}

		// We can't track positionals, so passing the positional kenki values through as a potential gain
		this.modify(action[event.type], action.positional)
	}

	_onApplyMeditate(event) {
		this.meditateStart = event.timestamp
	}

	_onRemoveMeditate(event) {
		const diff = event.timestamp - this.meditateStart

		const ticks = Math.min(Math.floor(diff / MEDITATE_TICK_FREQUENCY), MAX_MEDITATE_TICKS)

		// Ticks could occur at any point in the duration (server tick) - add an extra potential tick if they missed one so we don't under-guess
		this.modify(ticks * KENKI_PER_MEDITATE_TICK, ticks === MAX_MEDITATE_TICKS? 0 : KENKI_PER_MEDITATE_TICK)
	}

	_onComplete() {
		// this.suggestions.add(new TieredSuggestion({
		// 	icon: ACTIONS.HAKAZE.icon,
		// 	content: <>
		// 		You used kenki builders in a way that overcapped you.
		// 	</>,
		// 	tiers: {
		// 		20: SEVERITY.MINOR,
		// 		21: SEVERITY.MEDIUM,
		// 		50: SEVERITY.MAJOR,
		// 	},
		// 	value: this._wasted,
		// 	why: <>
		// 		You wasted {this._wasted} kenki by using abilities that sent you over the cap.
		// 	</>,
		// }))
	}

	output() {
		const sam = Color(JOBS.SAMURAI.colour)

		// Disabling magic numbers for the chart, 'cus it's a chart
		/* eslint-disable no-magic-numbers */
		const data = {
			datasets: [{
				label: 'Minimum',
				data: this._history.min,
				steppedLine: true,
				fill: false,
				borderColor: 'transparent',
				pointRadius: 0,
				pointHitRadius: 10,
			}, {
				label: 'Maximum',
				data: this._history.max,
				steppedLine: true,
				backgroundColor: sam.fade(0.5),
				borderColor: sam.fade(0.2),
				fill: '-1',
				pointRadius: 0,
				pointHitRadius: 10,
			}],
		}
		/* eslint-enable no-magic-numbers */

		return <TimeLineChart
			data={data}
			options={{
				legend: false,
				tooltips: {
					mode: 'index',
					displayColors: false,
				},
			}}
		/>
	}
}
