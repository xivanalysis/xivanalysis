import Color from 'color'
import {Trans} from '@lingui/react'
import React from 'react'
import TimeLineChart from 'components/ui/TimeLineChart'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import JOBS from 'data/JOBS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// General actions that generate Rage
const RAGE_GENERATORS = {
	[ACTIONS.MAIM.id]: 10,
	[ACTIONS.STORMS_EYE.id]: 10,
	[ACTIONS.SKULL_SUNDER.id]: 10,
	[ACTIONS.BUTCHERS_BLOCK.id]: 10,
	[ACTIONS.STORMS_PATH.id]: 20,
//	[ACTIONS.INFURIATE.id]: 50,
}

//Actions that cost Rage
const RAGE_SPENDERS = {
	[ACTIONS.FELL_CLEAVE.id]: 50,
	[ACTIONS.INNER_BEAST.id]: 50,
	[ACTIONS.STEEL_CYCLONE.id]: 50,
	[ACTIONS.DECIMATE.id]: 50,
	[ACTIONS.UPHEAVAL.id]: 20,
	[ACTIONS.ONSLAUGHT.id]: 20,
}

const RAGE_USAGE_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

// Max Rage
const MAX_RAGE = 100

export default class Gauge extends Module {
	static handle = 'gauge'
	static title = 'Gauge Usage'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	// -----
	// Properties
	// -----
	// I'm assuming it'll start at 0 (which, in nine out of ten cases, should be it. I can't think of any fringe cases right now.)
	_rage = 0
	_wastedRage = 0
	_history = {
		rage: [],
	}

	constructor(...args) {
		super(...args)
		//this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(RAGE_SPENDERS).map(Number)}, this._onSpenderCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.INFURIATE.id}, this._onInfuriateCast)
		this.addHook('combo', {by: 'player'/*, abilityId: [ACTIONS.MAIM.id, ACTIONS.STORMS_EYE.id]*/}, this._onBuilderCast)
		this.addHook('complete', this._onComplete)
		console.log(`rage gen keys: ${Object.keys(RAGE_GENERATORS).map(Number)}`)
	}

	/*
	_onCast(event) {
		const abilityId = event.ability.guid

		// THIS THING TOOK ME TOO LONG TO FIGURE OUT AND I LOST SOME OF MY HAIR BY THE END OF IT
		//On a serious note, it just checks for the ability, then adds the rage with the _addRage function, which, handles the waste etc.
		//The if below that is a check if the player is under inner release or not. If it is, the cost isn't subtracted from your current rage,
		//And simply treats it like they didn't cost rage at all. Elegant solution.
		if (RAGE_GENERATORS[abilityId]) {
			this._addRage(abilityId)
		}
		if (RAGE_SPENDERS[abilityId] && !this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			this._rage -= RAGE_SPENDERS[abilityId]
		}

		if (abilityId in RAGE_GENERATORS || abilityId in RAGE_SPENDERS && !this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			this._pushToGraph()
		}
	}
	*/

	_onBuilderCast(event) {
		const abilityId = event.ability.guid

		console.log(`abilityId: ${abilityId}`)
		// Adds rage directly from the RAGE_GENERATOR object, using the abilityId handle.
		this._rage += RAGE_GENERATORS[abilityId]
		console.log(`${RAGE_GENERATORS[abilityId]}`)
		console.log(`Current rage as it's being added: ${this._rage}`)
		// Checks _rage against MAX_RAGE, and adds to waste if it's waste, does nothing if not.
		if (this._rage > MAX_RAGE) {
			const waste = this._rage - MAX_RAGE
			this._wastedRage += waste
			this._rage = MAX_RAGE
			console.log(` _rage: ${this._rage}`)
		}
		this._pushToGraph()
	}

	_onInfuriateCast(event) {
		const abilityId = event.ability.guid

		// Adds rage directly from the RAGE_GENERATOR object, using the abilityId handle.
		this._rage += RAGE_GENERATORS[abilityId]

		// Checks _rage against MAX_RAGE, and adds to waste if it's waste, does nothing if not.
		if (this._rage > MAX_RAGE) {
			const waste = this._rage - MAX_RAGE
			this._wastedRage += waste
			this._rage = MAX_RAGE
			console.log(this._rage)
		}
		this._pushToGraph()
	}

	_onSpenderCast(event) {
		if (!this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			this._rage = Math.max(this._rage - RAGE_SPENDERS[event.ability.guid], 0)
			console.log(`Current rage on spender cast: ${this._rage}`)
		}
		this._pushToGraph()
	}

	_pushToGraph() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this._history.rage.push({t: timestamp, y: this._rage})
	}

	_onDeath() {
		// Death just flat out resets everything. AND IT DOESN'T ADD DEATH TO GAUGE LOSS ANYMORE I'M SORRY
		this._rage = 0
		this._pushToGraph()
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.INFURIATE.icon,
			content: <Trans id="war.gauge.suggestions.lost-rage.content">
					You used <ActionLink {...ACTIONS.STORMS_PATH}/>, <ActionLink {...ACTIONS.STORMS_EYE}/>, <ActionLink {...ACTIONS.INFURIATE}/>, or any gauge generators in a way that overcapped you.
			</Trans>,
			why: <Trans id="war.gauge.suggestions.lost-rage.why">
				{this._wastedRage} rage wasted by using abilities that sent you over the cap.
			</Trans>,
			tiers: RAGE_USAGE_SEVERITY,
			value: this._wastedRage,
		}))
	}

	output() {
		const _rageColor = Color(JOBS.WARRIOR.colour)

		/* eslint-disable no-magic-numbers */
		const data = {
			datasets: [
				{
					label: 'Rage',
					steppedLine: true,
					data: this._history.rage,
					backgroundColor: _rageColor.fade(0.8),
					borderColor: _rageColor.fade(0.5),
				},
			],
		}

		return <TimeLineChart
			data={data}
		/>
		/* eslint-enable no-magic-numbers */
	}
}
