import React, {Fragment} from 'react'
import {Plural} from '@lingui/react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import Color from 'color'
import JOBS from 'data/JOBS'
import TimeLineChart from 'components/ui/TimeLineChart'

// -----
// UI stuff
// -----
const BLOODSPILLER_BLOOD_COST = 50
const FLOOD_EDGE_MP_COST = 3000

// -----
// Simulator fun time
// ------
// -----
// Meters
// ------
const MAX_MP = 10000
const MP_AFTER_RAISE = 2000
const MP_REGEN_PER_TICK = 200
const TICK_RATE = 3000

const MAX_BLOOD = 100

const RESOURCE_SPENDERS = {
	[ACTIONS.THE_BLACKEST_NIGHT.id]: {mp: -3000, blood: 0},
	[ACTIONS.FLOOD_OF_SHADOW.id]: {mp: -3000, blood: 0},
	[ACTIONS.EDGE_OF_SHADOW.id]: {mp: -3000, blood: 0},
	[ACTIONS.BLOODSPILLER.id]: {mp: 0, blood: -50},
	[ACTIONS.QUIETUS.id]: {mp: 0, blood: -50},
	[ACTIONS.LIVING_SHADOW.id]: {mp: 0, blood: -50},
}
const RESOURCE_GENERATORS = {
	[ACTIONS.CARVE_AND_SPIT.id]: {mp: 600, blood: 0, requiresCombo: false},
	[ACTIONS.SYPHON_STRIKE.id]: {mp: 600, blood: 0, requiresCombo: true},
	[ACTIONS.SOULEATER.id]: {mp: 0, blood: 20, requiresCombo: true},
	[ACTIONS.STALWART_SOUL.id]: {mp: 600, blood: 20, requiresCombo: true},
}

// Actions that generate blood and mana under blood weapon (Physical Damage actions - 3 blood, 480mp).
// redundant, but this keeps consistency with the other mappings
const BLOOD_WEAPON_GENERATORS = {
	[ACTIONS.HARD_SLASH.id]: {mp: 600, blood: 10},
	[ACTIONS.SYPHON_STRIKE.id]: {mp: 600, blood: 10},
	[ACTIONS.SOULEATER.id]: {mp: 600, blood: 10},
	[ACTIONS.BLOODSPILLER.id]: {mp: 600, blood: 10},
	[ACTIONS.QUIETUS.id]: {mp: 600, blood: 10},
	[ACTIONS.UNMEND.id]: {mp: 600, blood: 10},
	[ACTIONS.UNLEASH.id]: {mp: 600, blood: 10},
	[ACTIONS.STALWART_SOUL.id]: {mp: 600, blood: 10},
}

const DELIRIUM_GENERATORS = {
	[ACTIONS.BLOODSPILLER.id]: {mp: 200, blood: 0},
	[ACTIONS.QUIETUS.id]: {mp: 500, blood: 0},
}

// Tiered suggestion severities
const SEVERITY_THE_BLACKEST_NIGHT = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const SEVERITY_WASTED_BLOOD_ACTIONS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	4: SEVERITY.MAJOR,
}

const SEVERITY_WASTED_MP_ACTIONS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export default class Resources extends Module {
	static handle = 'resourcesim'
	static title = 'Resource Analyzer'
	static displayMode = DISPLAY_MODE.FULL
	static dependencies = [
		'combatants',
		'suggestions',
	]

	// -----
	// Resource utilities
	// -----
	_currentBlood = 0
	_wastedBlood = 0
	_currentMP = 0
	_wastedMP = 0
	// tracker stacks
	_history = {
		mp: [],
		blood: [],
	}
	// -----
	// Internal tracking of generator events for MP overcap calculations
	// -----
	_lastManaSpendEvent = null
	_gainedSinceLastSpend = 0
	_darkArtsProc = false
	// -----
	// Evaluation units
	// -----
	_droppedTBNs = 0

	_resourceEvents = [
		...Object.keys(RESOURCE_SPENDERS),
		...Object.keys(RESOURCE_GENERATORS),
		...Object.keys(BLOOD_WEAPON_GENERATORS),
		...Object.keys(DELIRIUM_GENERATORS),
	].map(Number)

	constructor(...args) {
		super(...args)
		this.addHook(['aoedamage', 'combo'], {by: 'player', abilityId: this._resourceEvents}, this._onEvent)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.BLACKEST_NIGHT.id}, this._onRemoveBlackestNight)
		this.addHook('death', {by: 'player'}, this._onDeath)
		this.addHook('raise', {by: 'player'}, this._onRaise)
		this.addHook('complete', this._onComplete)
	}

	// -----
	// Resource Utility Methods
	// -----

	checkMPOvercap(event, beforeActionMP, actionMPChange) {
		let lastSpendActionMP = 0
		let timeSinceLastSpendAction = 0
		let firstSpendAction = false

		if (this._lastManaSpendEvent !== null) {
			lastSpendActionMP = this._lastManaSpendEvent.afterActionMP
			timeSinceLastSpendAction = event.timestamp - this._lastManaSpendEvent.timestamp
		} else {
			// First spender in the fight, assume we start with max MP
			lastSpendActionMP = MAX_MP
			firstSpendAction = true
			timeSinceLastSpendAction = event.timestamp - this.parser.fight.start_time
		}

		let manaTicks = Math.floor(timeSinceLastSpendAction / TICK_RATE)

		if (actionMPChange < 0) {
			// Spender
			if (this._darkArtsProc) {
				actionMPChange = 0
				this._darkArtsProc = false
			}
			if (beforeActionMP === MAX_MP) {
				// MP was at cap before using spender, check for waste
				if (firstSpendAction) {
					// First spender in the fight, allow one tick before penalizing overflow from passive regeneration before first spender
					manaTicks = Math.floor(manaTicks - 1, 0)
				}
				// Add MP wasted due to ticks at cap (simulated).  MP waste due to generators will be calculated with the generator events
				this._wastedMP += Math.max(lastSpendActionMP + this._gainedSinceLastSpend + manaTicks * MP_REGEN_PER_TICK - MAX_MP, 0)
			}
			this._gainedSinceLastSpend = 0
			event.afterActionMP = beforeActionMP + actionMPChange
			this._lastManaSpendEvent = event
		} else {
			if (beforeActionMP + actionMPChange > MAX_MP) {
				// Generator, MP capped out with this action, check for waste
				this._wastedMP += beforeActionMP + actionMPChange - MAX_MP
				actionMPChange = MAX_MP - beforeActionMP
			}
			this._gainedSinceLastSpend += actionMPChange
		}
		this._currentMP = beforeActionMP + actionMPChange
	}

	checkBloodOvercap(actionBloodChange) {
		if (actionBloodChange < 0 && this.combatants.selected.hasStatus(STATUSES.DELIRIUM.id)) {
			// Spender within Delirium - no blood spent
			return
		}

		if (actionBloodChange !== 0) {
			this._currentBlood += actionBloodChange

			if (this._currentBlood > MAX_BLOOD) {
				// Check to determine if blood was overcapped by gain, mark as wasted if so
				this._wastedBlood += this._currentBlood - MAX_BLOOD
				this._currentBlood = MAX_BLOOD
			}
			if (this._currentBlood < 0) {
				// Sanity check - if blood drops below 0 from a spender, floor blood count at 0
				this._currentBlood = 0
			}
		}
	}

	_pushToGraph() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this._history.blood.push({t: timestamp, y: this._currentBlood})
		this._history.mp.push({t: timestamp, y: this._currentMP})
	}

	// -----
	// simulator util
	// ------

	_onDeath() {
		this._wastedMP += this._currentMP
		this._wastedBlood += this._currentBlood
		this._currentMP = 0
		this._currentBlood = 0
		this._pushToGraph()
	}

	_onRaise() {
		this._currentMP = MP_AFTER_RAISE
		this._pushToGraph()
	}

	_onEvent(event) {
		if (event.amount === 0) {
			// Misses or attacks against invuln targets do not trigger resource gain
			return
		}

		const abilityId = event.ability.guid
		let actionBloodGain = 0
		let actionMPGain = 0

		if (RESOURCE_SPENDERS.hasOwnProperty(abilityId)) {
			actionBloodGain += RESOURCE_SPENDERS[abilityId].blood
			actionMPGain += RESOURCE_SPENDERS[abilityId].mp
		}

		if (event.type !== 'combo' && this.combatants.selected.hasStatus(STATUSES.BLOOD_WEAPON.id) && BLOOD_WEAPON_GENERATORS.hasOwnProperty(abilityId)) {
			// Don't double count blood weapon gains on comboed events
			actionBloodGain += BLOOD_WEAPON_GENERATORS[abilityId].blood
			actionMPGain += BLOOD_WEAPON_GENERATORS[abilityId].mp
		}

		if (RESOURCE_GENERATORS.hasOwnProperty(abilityId)) {
			const actionInfo = RESOURCE_GENERATORS[abilityId]
			if ((!actionInfo.requiresCombo && event.type !== 'combo') || event.type === 'combo') {
			// Only gain resources if the action does not require a combo or is in a valid combo
				actionBloodGain += RESOURCE_GENERATORS[abilityId].blood
				actionMPGain += RESOURCE_GENERATORS[abilityId].mp
			}
		}

		this.checkBloodOvercap(actionBloodGain)

		const afterActionMP = (event.hasOwnProperty('sourceResources')) ? event.sourceResources.mp : 0
		this.checkMPOvercap(event, afterActionMP, actionMPGain)

		if (event.type !== 'combo') {
			// Don't push two entries to graph for comboed actions
			this._pushToGraph()
		}
	}

	_onRemoveBlackestNight(event) {
		const poppedTBN = event.absorb === 0
		if (poppedTBN) {
			//popped
			this._darkArtsProc = true
		} else {
			//expired
			this._droppedTBNs += 1
		}
	}

	// -----
	// ui
	// -----

	_onComplete() {
		// UI
		if (this._droppedTBNs > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.THE_BLACKEST_NIGHT.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> applications did not fully use the shield, and thus did not generate a Dark Arts proc to allow free use of <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/> or <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/>.
				</Fragment>,
				tiers: SEVERITY_THE_BLACKEST_NIGHT,
				value: this._droppedTBNs,
				why: <Fragment>
					You missed out on <Plural value={this._droppedTBNs} one="# Dark Arts use" other="# Dark Arts uses" /> due to Blackest Night applications that did not consume the shield.
				</Fragment>,
			}))
		}

		const wastedBloodActions = Math.floor(this._wastedBlood / BLOODSPILLER_BLOOD_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BLOODSPILLER.icon,
			content: <Fragment>
				Your blood gauge allows you to use <ActionLink {...ACTIONS.BLOODSPILLER}/> or other spenders, which are among your strongest attacks.  Be sure to spend your blood before exceeding the cap of 100.
			</Fragment>,
			tiers: SEVERITY_WASTED_BLOOD_ACTIONS,
			value: wastedBloodActions,
			why: <Fragment>
				You lost a total of <Plural value={wastedBloodActions} one="# blood spending skill" other="# blood spending skills" /> from gaining blood over the cap or from death.
			</Fragment>,
		}))

		const wastedMPActions = Math.floor(this._wastedMP / FLOOD_EDGE_MP_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.EDGE_OF_SHADOW.icon,
			content: <Fragment>
				Your MP allows you to use <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/>, a strong attack that gives you a persistent damage up buff, as well as the strong mitigation of <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/>.
				Be sure to consistently use your MP so you can benefit from natural regeneration and MP gain from your main combo skills.
			</Fragment>,
			tiers: SEVERITY_WASTED_MP_ACTIONS,
			value: wastedMPActions,
			why: <Fragment>
				You lost a total of <Plural value={wastedMPActions} one="# MP spending skill" other="# MP spending skills" /> from gaining MP over the cap or death.
			</Fragment>,
		}))
	}

	output() {
		// Mana usage and blood usage modules
		// make this into a pretty table
		// also include spenders and generators
		const _bloodColor = Color(JOBS.DARK_KNIGHT.colour)
		const _mpColor = Color('#f266a2')

		/* eslint-disable no-magic-numbers */
		const bloodchartdata = {
			datasets: [
				{
					label: 'Blood',
					steppedLine: true,
					data: this._history.blood,
					backgroundColor: _bloodColor.fade(0.8),
					borderColor: _bloodColor.fade(0.5),
				},
			],
		}
		const mpchartdata = {
			datasets: [
				{
					label: 'MP',
					steppedLine: true,
					data: this._history.mp,
					backgroundColor: _mpColor.fade(0.8),
					borderColor: _mpColor.fade(0.5),
				},
			],
		}
		/* eslint-enable no-magic-numbers */

		const mpChartOptions = {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						min: 0,
						max: 10000,
					},
				}],
			},
		}
		const bloodChartOptions = {
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
				data={bloodchartdata}
				options={bloodChartOptions}
			/>
			<TimeLineChart
				data={mpchartdata}
				options={mpChartOptions}
			/>
		</Fragment>
	}
}
