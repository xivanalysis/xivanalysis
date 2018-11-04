import Color from 'color'
import React from 'react'
// import _ from 'lodash'

import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// const MAX_KENKI = 100

const KENKI_ACTIONS = {
	// single target
	[ACTIONS.HAKAZE.id]: {cast: 5},
	[ACTIONS.JINPU.id]: {combo: 5}, // combo 5
	[ACTIONS.SHIFU.id]: {combo: 5}, // combo 5
	[ACTIONS.YUKIKAZE.id]: {combo: 10}, // combo 10
	[ACTIONS.GEKKO.id]: {combo: 10}, // combo 5, positional 5
	[ACTIONS.KASHA.id]: {combo: 10}, // combo 5 positional 5

	// aoe
	[ACTIONS.FUGA.id]: {cast: 5},
	[ACTIONS.MANGETSU.id]: {combo: 10}, // combo 10
	[ACTIONS.OKA.id]: {combo: 10}, // combo 10

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

	// TODO: AGEHA - 10, 30 if kill
}

const KENKI_PER_MEDITATE_TICK = 10
const MEDITATE_TICK_FREQUENCY = 3000
const MAX_MEDITATE_TICKS = 5

export default class Kenki extends Module {
	static handle = 'kenki'
	static dependencies = [
		'suggestions',
	]
	static displayOrder = -100

	// Kenki
	_kenki = 0
	_wasted = 0
	_history = []

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
		this.addHook('death', {to: 'player'}, () => this._kenki = 0)

		// Misc
		this.addHook('complete', this._onComplete)
	}

	// kenki quick maths
	modify(amount) {
		const kenki = this._kenki + amount
		this._kenki = kenki // _.clamp(kenki, 0, MAX_KENKI)

		this._wasted += Math.max(0, kenki - this._kenki)

		// This should theoretically never happen but we all know damn well it will.
		if (kenki - this._kenki < 0) {
			console.error(`Dropping below 0 kenki: ${kenki}/100`)
		}

		this._history.push({
			t: this.parser.currentTimestamp - this.parser.fight.start_time,
			y: this._kenki,
		})
	}

	_onAction(event) {
		const action = KENKI_ACTIONS[event.ability.guid]

		if (!action | !action[event.type]) {
			return
		}

		this.modify(action[event.type])
	}

	_onApplyMeditate(event) {
		this.meditateStart = event.timestamp
	}

	_onRemoveMeditate(event) {
		const diff = event.timestamp - this.meditateStart

		// Ticks could occur at any point in the duration (server tick) - add an extra tick to be sure we don't under-guess
		// TODO: Handle the extra tick with potential kenki handling
		const ticks = Math.min(Math.floor(diff / MEDITATE_TICK_FREQUENCY) + 1, MAX_MEDITATE_TICKS)

		this.modify(ticks * KENKI_PER_MEDITATE_TICK)
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HAKAZE.icon,
			content: <>
				You used kenki builders in a way that overcapped you.
			</>,
			tiers: {
				20: SEVERITY.MINOR,
				21: SEVERITY.MEDIUM,
				50: SEVERITY.MAJOR,
			},
			value: this._wasted,
			why: <>
				You wasted {this._wasted} kenki by using abilities that sent you over the cap.
			</>,
		}))
	}

	output() {
		const sam = Color(JOBS.SAMURAI.colour)

		// Disabling magic numbers for the chart, 'cus it's a chart
		/* eslint-disable no-magic-numbers */
		const data = {
			datasets: [{
				label: 'Kenki',
				data: this._history,
				backgroundColor: sam.fade(0.5),
				borderColor: sam.fade(0.2),
				steppedLine: true,
			}],
		}
		/* eslint-enable no-magic-numbers */

		return <TimeLineChart
			data={data}
			options={{legend: false}}
		/>
	}
}
