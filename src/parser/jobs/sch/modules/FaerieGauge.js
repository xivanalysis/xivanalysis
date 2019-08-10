import React, {Fragment} from 'react'
import {Trans} from '@lingui/react'
import {t} from '@lingui/macro'
import Color from 'color'

import {getDataBy} from 'data'
import JOBS from 'data/JOBS'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'

const SUMMON_ACTIONS = [
	ACTIONS.SUMMON_EOS.id,
	ACTIONS.SUMMON_SELENE.id,
]
// Actions that generate fairy gauge
const GAUGE_GENERATORS = [
	ACTIONS.SCH_ENERGY_DRAIN.id,
	ACTIONS.LUSTRATE.id,
	ACTIONS.INDOMITABILITY.id,
	ACTIONS.SACRED_SOIL.id,
	ACTIONS.EXCOGITATION.id,
]
// Gauge limits
const GAUGE_MAX = 100
const GAUGE_START = 0
const GAUGE_GAIN_AMOUNT = 10
// Graph color
const GRAPH_COLOR = Color(JOBS.SCHOLAR.colour)
const BG_COLOR_FADE = 0.8
const BORDER_COLOR_FADE = 0.5
// Severity markers for overcap
// Start at 30 because you can overcap when seraph is out and you can't drain the gauge
const GAUGE_WASTE_SEVERITY = {
	30: SEVERITY.MINOR,
	50: SEVERITY.MEDIUM,
}

export default class FaerieGauge extends Module {
	static handle = 'fairieGauge'
	static title = t('sch.gauge.title')`Faerie Gauge Usage`
	static dependencies = [
		'combatants',
		'suggestions',
	]

	// Defaults
	_gauge = GAUGE_START
	_waste = 0
	_history = []
	_fairyOut = false
	_noFairyAtStart = false

	constructor(...args) {
		super(...args)

		// consumers
		this.addHook('heal', {by: 'pet', abilityId: STATUSES.FEY_UNION.id}, this._onGaugeSpend)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.SCH_FEY_BLESSING.id}, this._onGaugeSpend)
		this.addHook('death', {to: 'player'}, this._onDeath) // I mean.. it does consume all your gauge..
		// generators
		this.addHook('cast', {by: 'player', abilityId: GAUGE_GENERATORS}, this._onGaugeGenerate)
		this.addHook('complete', this._onComplete)
		// summoning a fairy
		this.addHook('cast', {by: 'player', abilityId: SUMMON_ACTIONS}, this._onSummon)
	}

	// Search through the events to figure out if there was a fairy out before logs started
	normalise(events) {
		for (const event of events) {
			if (!event.ability) { continue }

			const action = getDataBy(ACTIONS, 'id', event.ability.guid)
			if (!action) { continue }

			// if the first action we find is a summon action, bail out and give a warning later
			if (action.id && SUMMON_ACTIONS.includes(action.id)) {
				this._noFairyAtStart = true
				break
			}

			const pet = this.parser.report.friendlyPets.find(pet => pet.id === event.sourceID)
				|| {petOwner: -1}

			// Ignore events that aren't related to your fairy
			if (
				event.type !== 'cast' ||
				!event.sourceIsFriendly ||
				pet.petOwner !== this.parser.player.id ||
				!action.pet
			) { continue }

			// Fairy found
			this._fairyOut = true
			break
		}

		return events
	}

	_onSummon() {
		this._fairyOut = true
	}

	// both spenders and generators consume the same amount
	_onGaugeSpend() {
		this._gauge -= GAUGE_GAIN_AMOUNT
		this._updateHistory()
	}

	_onGaugeGenerate() {
		if (this.combatants.selected.hasStatus(STATUSES.DISSIPATION.id) || ! this._fairyOut) {
			// can't generate a guage without the fairy, so bail out
			return
		}

		this._gauge += GAUGE_GAIN_AMOUNT
		// figure out if we've capped and add to waste
		if (this._gauge > GAUGE_MAX) {
			this._gauge = GAUGE_MAX
			this._waste += GAUGE_GAIN_AMOUNT
		}

		this._updateHistory()
	}

	_onDeath() {
		this._fairyOut = false
		this._gauge = 0
		this._updateHistory()
	}

	_updateHistory() {
		const ts = this.parser.currentTimestamp - this.parser.fight.start_time
		this._history.push({t: ts, y: this._gauge})
	}

	_onComplete() {
		// Warn on fairy not being out at the start
		if (this._noFairyAtStart) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_SERAPH.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="sch.gauge.nofairyatstart.content">
					Your fairy is a considerable amount of your healing kit. Make sure to use <ActionLink {...ACTIONS.SUMMON_EOS}/> or <ActionLink {...ACTIONS.SUMMON_SELENE}/> prior to the start of combat
				</Trans>,
				why: <Trans id="sch.gauge.nofairyatstart.why">Your fairy was not summoned at the start of combat.</Trans>,
			}))
		}

		// Suggest that they use their gauge consumers at certain overcap points
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FEY_BLESSING.icon,
			tiers: GAUGE_WASTE_SEVERITY,
			value: this._waste,
			content: <Trans id="sch.gauge.waste.suggestion.content">Try to make use of your Faerie Gauge abilities <ActionLink {...ACTIONS.FEY_UNION}/> and <ActionLink {...ACTIONS.FEY_BLESSING}/>, since they are free oGCD heals that come naturally from using Aetherflow abilities.</Trans>,
			why: <Trans id="sch.gauge.waste.suggestion.why">A total of {this._waste} gauge was lost due to exceeding the cap.</Trans>,
		}))
	}

	// Generate the gauge graph
	output() {
		const data = {
			datasets: [
				{
					label: 'Faerie Gauge',
					steppedLine: true,
					data: this._history,
					backgroundColor: GRAPH_COLOR.fade(BG_COLOR_FADE),
					borderColor: GRAPH_COLOR.fade(BORDER_COLOR_FADE),
				},
			],
		}

		return <Fragment>
			<TimeLineChart
				data={data}
			/>
			<Trans id="sch.gauge.waste">
				A total of {this._waste} Faerie Gauge was wasted due to overcapping.
			</Trans>
		</Fragment>

	}
}
