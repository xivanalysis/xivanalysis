import Color from 'color'
import React, {Fragment} from 'react'
import _ from 'lodash'

import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import JOBS from 'data/JOBS'

//future-proofing for more kenki actions

const MAX_KENKI = 100

const KENKI_PER_SEN = 20

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

const SEN = {
	SETSU: 'Setsu',
	GETSU: 'Getsu',
	KA: 'Ka',
}

const SEN_ACTIONS = {
	[ACTIONS.YUKIKAZE.id]: SEN.SETSU,

	[ACTIONS.GEKKO.id]: SEN.GETSU,
	[ACTIONS.MANGETSU.id]: SEN.GETSU,

	[ACTIONS.KASHA.id]: SEN.KA,
	[ACTIONS.OKA.id]: SEN.KA,
}

const IAIJUTSU = [
	ACTIONS.HIGANBANA.id,
	ACTIONS.TENKA_GOKEN.id,
	ACTIONS.MIDARE_SETSUGEKKA.id,
]

// sen stuff

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'suggestions',
	]
	static displayOrder = -100

	// kenki
	_kenki = 0
	_wastedKenki = 0
	_kenkiHistory = []

	// meditate
	_Meditate = []

	// sen
	_sen = {
		[SEN.SETSU]: false,
		[SEN.GETSU]: false,
		[SEN.KA]: false,
	}

	_wastedsen = 0

	constructor(...args) {
		super(...args)

		// Kenki
		this.addHook(
			'cast',
			{by: 'player', abilityId: Object.keys(KENKI_ACTIONS).map(Number)},
			event => this._modifyKenki(KENKI_ACTIONS[event.ability.guid]),
		)

		// Sen
		this.addHook(
			'cast',
			{by: 'player', abilityId: Object.keys(SEN_ACTIONS).map(Number)},
			this._onSenAction,
		)
		this.addHook('cast', {by: 'player', abilityId: IAIJUTSU}, this._removeSen)

		// Hagakure because he's a speshul boi
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.HAGAKURE.id}, this._onHagakure)

		// Misc
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onSenAction(event) {
		const sen = SEN_ACTIONS[event.ability.guid]

		if (this._sen[sen]) {
			this._wastedsen ++
		}

		this._sen[sen] = true
	}

	_onHagakure() {
		// Work out how many sen are currently active
		const activeSen = Object.entries(this._sen)
			.filter(([, active]) => active)
			.length

		// Add the new kenki, wipe the sen
		this._modifyKenki(activeSen * KENKI_PER_SEN)
		this._removeSen()
	}

	_removeSen() {
		this._sen = _.mapValues(this._sen, () => false)
	}

	_onDeath() {
		// Death just flat out resets everything. Stop dying.
		// Not marking as wasted, they're already being flagged w/ the morbid
		this._kenki = 0
		this._removeSen()
	}

	// kenki quick maths
	_modifyKenki(amount) {
		const kenki = this._kenki + amount
		this._kenki = _.clamp(kenki, 0, MAX_KENKI)

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
