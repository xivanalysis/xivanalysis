import Color from 'color'
import React, {Fragment} from 'react'
import {clamp} from 'lodash'

import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import JOBS from 'data/JOBS'

//future-proofing for more kenki actions

const MAX_KENKI = 100


const KENKI_ACTIONS = {
	// single target
	[ACTIONS.HAKAZE.id]: 5,
	[ACTIONS.JINPU.id]: 5, // combo5
	[ACTIONS.SHIFU.id]: 5, // combo 5
	[ACTIONS.YUKIKAZE.id]: 10, // combo 10
	[ACTIONS.GEKKO.id]: 10, // combo 5, positional 5
	[ACTIONS.KASHA.id]: 10, // combo 5 positional 5

	// aoe
	[ACTIONS.FUGA.id]: 5,
	[ACTIONS.MANGETSU.id]: 10, // combo 10
	[ACTIONS.OKA.id]: 10, // combo 10

	// ranged
	[ACTIONS.ENPI.id]: 10,

	// spenders
	[ACTIONS.HISSATSU_GYOTEN.id]: -10,
	[ACTIONS.HISSATSU_YATEN.id]: -10,
	[ACTIONS.HISSATSU_SEIGAN.id]: -15,
	[ACTIONS.HISSATSU_KAITEN.id]: -20,
	[ACTIONS.HISSATSU_SHINTEN.id]: -25,
	[ACTIONS.HISSATSU_KYUTEN.id]: -25,
	[ACTIONS.HISSATSU_GUREN.id]: -50,

	// TODO: MEDITATION
	// TODO: AGEHA
}

// sen stuff

// 1 sen value for each finisher. using finisher with sen you already have is bad.
const MAX_GEKKO_SEN = 1
const MAX_KASHA_SEN = 1
const MAX_YUKIKAZE_SEN = 1

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'suggestions',
	]

	//kenki
	_kenki = 0
	_wastedKenki = 0
	_kenkiHistory = []

	//meditate
	_Meditate = []

	//sen
	_gekkosen = 0
	_kashasen = 0
	_yukikazesen = 0

	_wastedsen = 0

	constructor(...args) {
		super(...args)

		this.addHook(
			'cast',
			{by: 'player', abilityId: Object.keys(KENKI_ACTIONS).map(Number)},
			event => this._modifyKenki(KENKI_ACTIONS[event.ability.guid])
		)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	//check for kenki value changes, then sen changes
	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.HAGAKURE.id) {
			this._Sen2Kenki()
		}
		if (abilityId ===ACTIONS.HIGANBANA.id || abilityId === ACTIONS.TENKA_GOKEN.id || abilityId === ACTIONS.MIDARE_SETSUGEKKA.id) {
			this._removeSen()
		}
		if (abilityId === ACTIONS.GEKKO.id || abilityId === ACTIONS.MANGETSU.id) {
			this._addGekkoSen()
		}
		if (abilityId === ACTIONS.KASHA.id || abilityId === ACTIONS.OKA.id) {
			this._addKashaSen()
		}
		if (abilityId === ACTIONS.YUKIKAZE.id) {
			this._addYukikazeSen()
		}
	}

	//kenki quick maths

	_modifyKenki(amount) {
		const kenki = this._kenki + amount
		this._kenki = clamp(kenki, 0, MAX_KENKI)

		this._wastedKenki += Math.max(0, kenki - this._kenki)

		// This should theoretically never happen but we all know damn well it will.
		if (kenki - this._kenki < 0) {
			console.error(`Dropping below 0 kenki: ${kenki}/100`)
		}

		this._kenkiHistory.push({
			t: this.parser.currentTimestamp,
			y: this._kenki,
		})
	}

	_Sen2Kenki() {
		this._kenki += ((this._gekkosen + this._kashasen + this._yukikazesen) * 20)
		if (this.kenki > MAX_KENKI) {
			const waste = this._kenki - MAX_KENKI
			this._wastedKenki += waste
			this._kenki = MAX_KENKI
			return waste
		}

		this._removeSen()

		return 0
	}

	//sen calcs

	_addGekkoSen() {
		this._gekkosen += 1
		if (this._gekkosen > MAX_GEKKO_SEN) {
			const waste = this._gekkosen - MAX_GEKKO_SEN
			this._gekkosen -= waste
			this._wastedsen += waste
			return waste
		}
		return 0
	}

	_addKashaSen() {
		this._kashasen += 1
		if (this._kashasen > MAX_KASHA_SEN) {
			const waste = this._kashasen - MAX_KASHA_SEN
			this._kashasen -= waste
			this._wastedsen += waste
			return waste
		}
		return 0
	}

	_addYukikazeSen()  {
		this._yukikazesen += 1
		if (this._yukikazesen > MAX_YUKIKAZE_SEN) {
			const waste = this._yukikazesen - MAX_YUKIKAZE_SEN
			this._yukikazesen -= waste
			this._wastedsen += waste
			return waste
		}
		return 0
	}

	_removeSen() {
		this._gekkosen = 0
		this._kashasen = 0
		this._yukikazesen = 0

		return 0
	}

	_onDeath() {
		// Death just flat out resets everything. Stop dying.
		this._wastedKenki += this._kenki
		this._kenki = 0

		this._wastedsen += (this._gekkosen + this._kashasen + this._yukikzaesen)
		this._gekkosen = this._kashasen = this._yukikazesen = 0
	}

	_onComplete() {
		//kenki suggestions
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HAKAZE.icon,
			content: <Fragment>
				You used kenki builders in a way that overcapped you.
			</Fragment>,
			tiers: {
				20: SEVERITY.MINOR,
				21: SEVERITY.MEDIUM,
				50: SEVERITY.MAJOR,
			},
			value: this._wastedKenki,
			why: <Fragment>
				You wasted {this._wastedKenki} kenki by using abilities that sent you over the cap.
			</Fragment>,
		}))

		//sen suggestions
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <Fragment>
				You used <ActionLink {...ACTIONS.GEKKO}/>, <ActionLink {...ACTIONS.KASHA}/>, <ActionLink {...ACTIONS.YUKIKAZE}/>, at a time when you already had that sen, thus wasting a combo because it did not give you sen.
			</Fragment>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._wastedsen,
			why: <Fragment>
				You lost {this._wastedsen} sen by using finishing combos that gave you sen you already had.
			</Fragment>,
		}))
	}

	output() {
		const sam = Color(JOBS.SAMURAI.colour)

		// Disabling magic numbers for the chart, 'cus it's a chart
		/* eslint-disable no-magic-numbers */
		const data = {
			datasets: [{
				label: 'Kenki',
				data: this._kenkiHistory,
				backgroundColor: sam.fade(0.5),
				borderColor: sam.fade(0.2),
				steppedLine: true,
			}],
		}
		/* eslint-enable no-magic-numbers */

		return <TimeLineChart
			data={data}
		/>
	}
}
