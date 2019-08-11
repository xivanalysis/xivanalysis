import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import _ from 'lodash'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// General actions that generate Rage
const RAGE_GENERATORS = {
	[ACTIONS.MAIM.id]: 10,
	[ACTIONS.STORMS_EYE.id]: 10,
	[ACTIONS.STORMS_PATH.id]: 20,
	[ACTIONS.INFURIATE.id]: 50,
	[ACTIONS.MYTHRIL_TEMPEST.id]: 20,
}

//Actions that cost Rage
const RAGE_SPENDERS = {
	[ACTIONS.FELL_CLEAVE.id]: 50,
	[ACTIONS.INNER_BEAST.id]: 50,
	[ACTIONS.STEEL_CYCLONE.id]: 50,
	[ACTIONS.DECIMATE.id]: 50,
	[ACTIONS.UPHEAVAL.id]: 20,
	[ACTIONS.ONSLAUGHT.id]: 20,
	[ACTIONS.CHAOTIC_CYCLONE.id]: 50,
	[ACTIONS.INNER_CHAOS.id]: 50,
}

// Actions that reduce Infuriate
const INFURIATE_REDUCERS = [
	ACTIONS.FELL_CLEAVE.id,
	ACTIONS.INNER_BEAST.id,
	ACTIONS.STEEL_CYCLONE.id,
	ACTIONS.DECIMATE.id,
	ACTIONS.CHAOTIC_CYCLONE.id,
	ACTIONS.INNER_CHAOS.id,
]

const INFURIATE_REDUCTION = 5

const RAGE_USAGE_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

// Max Rage
const MAX_RAGE = 100

export default class Gauge extends Module {
	static handle = 'gauge'
	static title = t('war.gauge.title')`Gauge Usage`
	static dependencies = [
		'combatants',
		'suggestions',
		'cooldowns',
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
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(RAGE_SPENDERS).map(Number)}, this._onSpenderCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.INFURIATE.id}, this._onInfuriateCast)
		this.addHook('combo', {by: 'player', abilityId: Object.keys(RAGE_GENERATORS).map(Number)}, this._onBuilderCast)
		this.addHook('complete', this._onComplete)
	}

	_addRage(abilityId) {
		// Adds rage directly from the RAGE_GENERATOR object, using the abilityId handle.
		this._rage += RAGE_GENERATORS[abilityId]

		// Checks if _rage is going above MAX_RAGE, and adds it to waste, then returns if it is.
		if (this._rage > MAX_RAGE) {
			const waste = this._rage - MAX_RAGE
			this._wastedRage += waste
			this._rage = MAX_RAGE
			return waste
		}
		return 0
	}

	_onBuilderCast(event) {
		this._addRage(event.ability.guid)
		this._pushToGraph()
	}

	_onSpenderCast(event) {
		if (!this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			this._rage = Math.max(this._rage - RAGE_SPENDERS[event.ability.guid], 0)
		}

		if (_.includes(INFURIATE_REDUCERS, event.ability.guid)) {
			this.cooldowns.reduceCooldown(ACTIONS.INFURIATE.id, INFURIATE_REDUCTION)
		}

		// This pushes everytime a spender is used -- Even if under Inner Release. That makes the graph have multiple dots, meaning a spender was used each dot.
		// The whole point of this is to show when IR is being used. Might try using different colors for the dots depending on which ability
		// They were used on.
		// TODO: Check if coloring the dots differently per ability is possible.
		this._pushToGraph()
	}

	_onInfuriateCast(event) {
		this._addRage(event.ability.guid)
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
