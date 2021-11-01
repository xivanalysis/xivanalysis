import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// -----
// UI stuff
// -----
const FLOOD_EDGE_MP_COST = 3000

// -----
// Meters
// ------
const MAX_MP = 10000
const MP_AFTER_RAISE = 2000
const MP_REGEN_PER_TICK = 200
const TICK_RATE = 3000

const RESOURCE_SPENDERS = {
	[ACTIONS.THE_BLACKEST_NIGHT.id]: {mp: -3000},
	[ACTIONS.FLOOD_OF_SHADOW.id]: {mp: -3000},
	[ACTIONS.EDGE_OF_SHADOW.id]: {mp: -3000},
}

const RESOURCE_GENERATORS = {
	[ACTIONS.CARVE_AND_SPIT.id]: {mp: 600, requiresCombo: false},
	[ACTIONS.SYPHON_STRIKE.id]: {mp: 600, requiresCombo: true},
	[ACTIONS.STALWART_SOUL.id]: {mp: 600, requiresCombo: true},
}

// Actions that generate mana under blood weapon
const BLOOD_WEAPON_GENERATORS = {
	[ACTIONS.HARD_SLASH.id]: {mp: 600},
	[ACTIONS.SYPHON_STRIKE.id]: {mp: 600},
	[ACTIONS.SOULEATER.id]: {mp: 600},
	[ACTIONS.BLOODSPILLER.id]: {mp: 600},
	[ACTIONS.QUIETUS.id]: {mp: 600},
	[ACTIONS.UNMEND.id]: {mp: 600},
	[ACTIONS.UNLEASH.id]: {mp: 600},
	[ACTIONS.STALWART_SOUL.id]: {mp: 600},
}

const DELIRIUM_GENERATORS = {
	[ACTIONS.BLOODSPILLER.id]: {mp: 200},
	[ACTIONS.QUIETUS.id]: {mp: 500},
}

// Tiered suggestion severities
const SEVERITY_THE_BLACKEST_NIGHT = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const SEVERITY_WASTED_MP_ACTIONS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export default class Resources extends Module {
	static handle = 'resourceanalyzer'
	static title = t('drk.resourceanalyzer.title')`Resource Analyzer`
	static displayMode = DISPLAY_MODE.FULL
	static displayOrder = DISPLAY_ORDER.RESOURCES
	static dependencies = [
		'combatants',
		'suggestions',
	]

	// -----
	// Resource utilities
	// -----
	_currentMP = 0
	_wastedMP = 0
	// tracker stacks
	_history = {
		mp: [],
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
		this.addEventHook(['normaliseddamage', 'combo'], {by: 'player', abilityId: this._resourceEvents}, this._onEvent)
		// Hook cast for Living Shadow, as it doesn't directly deal damage so doesn't have a damage event
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.LIVING_SHADOW.id}, this._onEvent)
		// Hook cast for TBN application
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.THE_BLACKEST_NIGHT.id}, this._onCastBlackestNight)
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.BLACKEST_NIGHT.id}, this._onRemoveBlackestNight)
		this.addEventHook('death', {by: 'player'}, this._onDeath)
		this.addEventHook('raise', {by: 'player'}, this._onRaise)
		this.addEventHook('complete', this._onComplete)
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

		if (actionMPChange <= 0) {
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

		this._pushToMPGraph()
	}

	_pushToMPGraph() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this._history.mp.push({t: timestamp, y: this._currentMP})
	}

	// -----
	// simulator util
	// ------

	_onDeath() {
		this._wastedMP += this._currentMP
		this._currentMP = 0
		this._pushToMPGraph()
	}

	_onRaise() {
		this._currentMP = MP_AFTER_RAISE
		this._pushToMPGraph()
	}

	_onEvent(event) {
		const abilityId = event.ability.guid
		let actionMPGain = 0

		if (RESOURCE_SPENDERS[abilityId] != null) {
			if (RESOURCE_SPENDERS[abilityId].mp < 0 && this._darkArtsProc) {
				// MP Spending attack (Edge/Flood of Shadow) - free with Dark Arts proc
				actionMPGain += 0
				this._darkArtsProc = false
			} else {
				actionMPGain += RESOURCE_SPENDERS[abilityId].mp
			}
		}

		if (event.hasSuccessfulHit && (event.type !== 'combo' && this.combatants.selected.hasStatus(STATUSES.BLOOD_WEAPON.id) && BLOOD_WEAPON_GENERATORS[abilityId] != null)) {
			// Actions that did not hit do not generate resources
			// Don't double count blood weapon gains on comboed events
			actionMPGain += BLOOD_WEAPON_GENERATORS[abilityId].mp
		}

		if (event.hasSuccessfulHit && RESOURCE_GENERATORS[abilityId] != null) {
			// Actions that did not hit do not generate resources
			const actionInfo = RESOURCE_GENERATORS[abilityId]
			if ((!actionInfo.requiresCombo && event.type !== 'combo') || event.type === 'combo') {
			// Only gain resources if the action does not require a combo or is in a valid combo
				actionMPGain += RESOURCE_GENERATORS[abilityId].mp
			}
		}

		const afterActionMP = event.sourceResources?.mp ?? 0
		this.checkMPOvercap(event, afterActionMP, actionMPGain)
	}

	_onCastBlackestNight(event) {
		const abilityId = event.ability.guid
		const actionMPGain = RESOURCE_SPENDERS[abilityId].mp
		const afterActionMP = event.sourceResources?.mp ?? 0
		this.checkMPOvercap(event, afterActionMP, actionMPGain)
		this._pushToMPGraph()
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
				content: <Trans id="drk.resourceanalyzer.blackestnight.content">
					One or more <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> applications did not fully use the shield, and thus did not generate a Dark Arts proc to allow free use of <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/> or <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/>.
				</Trans>,
				tiers: SEVERITY_THE_BLACKEST_NIGHT,
				value: this._droppedTBNs,
				why: <Trans id="drk.resourceanalyzer.blackestnight.why">
					You missed out on <Plural value={this._droppedTBNs} one="# Dark Arts use" other="# Dark Arts uses" /> due to Blackest Night applications that did not consume the shield.
				</Trans>,
			}))
		}

		const wastedMPActions = Math.floor(this._wastedMP / FLOOD_EDGE_MP_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.EDGE_OF_SHADOW.icon,
			content: <Trans id="drk.resourceanalyzer.wastedmp.content">
				Your MP allows you to use <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/>, a strong attack that gives you a persistent damage up buff, as well as the strong mitigation of <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/>.
				Be sure to consistently use your MP so you can benefit from natural regeneration and MP gain from your main combo skills.
			</Trans>,
			tiers: SEVERITY_WASTED_MP_ACTIONS,
			value: wastedMPActions,
			why: <Trans id="drk.resourceanalyzer.wastedmp.why">
				You lost a total of <Plural value={wastedMPActions} one="# MP spending skill" other="# MP spending skills" /> from gaining MP over the cap or death.
			</Trans>,
		}))
	}

	output() {
		// Mana usage module
		// make this into a pretty table
		// also include spenders and generators
		const _mpColor = Color('#f266a2')

		/* eslint-disable @typescript-eslint/no-magic-numbers */
		const mpchartdata = {
			datasets: [
				{
					label: 'MP',
					steppedLine: true,
					data: this._history.mp,
					backgroundColor: _mpColor.fade(0.8).toString(),
					borderColor: _mpColor.fade(0.5).toString(),
				},
			],
		}
		/* eslint-enable @typescript-eslint/no-magic-numbers */

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

		return <Fragment>
			<TimeLineChart
				data={mpchartdata}
				options={mpChartOptions}
			/>
		</Fragment>
	}
}
