import Color from 'color'
import React, {Fragment} from 'react'
import PATCHES, {getPatch} from 'data/PATCHES'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {i18nMark, Trans} from '@lingui/react'
//import {getCooldownRemaining} from 'parser/core/modules/Cooldowns'
//import {ActionLink} from 'components/ui/DbLink'
//TODO: Should possibly look into different Icons for things in Suggestions

//Mana Gains and Expenditures
export const MANA_GAIN = {
	[ACTIONS.VERSTONE.id]: {white: 9, black: 0},
	[ACTIONS.VERFIRE.id]: {white: 0, black: 9},
	[ACTIONS.VERAERO.id]: {white: 11, black: 0},
	[ACTIONS.VERTHUNDER.id]: {white: 0, black: 11},
	[ACTIONS.VERHOLY.id]: {white: 21, black: 0},
	[ACTIONS.VERFLARE.id]: {white: 0, black: 21},
	[ACTIONS.JOLT.id]: {white: 3, black: 3},
	[ACTIONS.JOLT_II.id]: {white: 3, black: 3},
	[ACTIONS.IMPACT.id]: {white: 4, black: 4},
	[ACTIONS.SCATTER.id]: {white: 3, black: 3},
	[ACTIONS.ENCHANTED_RIPOSTE.id]: {white: -30, black: -30},
	[ACTIONS.ENCHANTED_ZWERCHHAU.id]: {white: -25, black: -25},
	[ACTIONS.ENCHANTED_REDOUBLEMENT.id]: {white: -25, black: -25},
	[ACTIONS.ENCHANTED_MOULINET.id]: {white: -30, black: -30},
}

export const SEVERITY_WASTED_MANA = {
	1: SEVERITY.MINOR,
	20: SEVERITY.MEDIUM,
	80: SEVERITY.MAJOR,
}

export const SEVERITY_LOST_MANA = {
	1: SEVERITY.MINOR,
	20: SEVERITY.MEDIUM,
	80: SEVERITY.MAJOR,
}

export const MANA_DIFFERENCE_THRESHOLD = 30
const MANA_LOST_DIVISOR = 2
export const MANA_CAP = 100
const ENHANCED_SCATTER_GAIN = 8
const ENHANCED_SCATTER_44_GAIN = 10
//const MISSING_HARDCAST_MANA_VALUE = 11  //removed with refactor to GaugeAction, change to damage type events prevents need for guessing at missing casts
const MANAFICATION_MULTIPLIER = 2

class GaugeAction {
	mana = {
		white: {
			beforecast: 0,
			aftercast: 0,
			overcaploss: 0,
			imbalanceloss: 0,
			invulnloss: 0,
		},
		black: {
			beforecast: 0,
			aftercast: 0,
			overcaploss: 0,
			imbalanceloss: 0,
			invulnloss: 0,
		},
	}

	constructor(startingWhite, startingBlack) {
		this.mana.white.beforecast = startingWhite
		this.mana.black.beforecast = startingBlack

		this.mana.white.aftercast = startingWhite
		this.mana.black.aftercast = startingBlack
	}

	calculateManaFicationManaGained() {
		//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
		//console.log('manafication')
		this.mana.white.aftercast = this.mana.white.beforecast * MANAFICATION_MULTIPLIER
		this.mana.black.aftercast = this.mana.black.beforecast * MANAFICATION_MULTIPLIER

		this.calculateManaOvercap()
	}

	calculateCastManaGained(event, actor, isPre44) {
		//Determine if the ability we used should yield any mana gain.
		//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
		//console.log(`Ability: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
		const abilityId = event.ability.guid
		let {white, black} = MANA_GAIN[abilityId] || {}
		if (white || black) {
			if (abilityId === ACTIONS.SCATTER.id) {
				//Check the Buffs on the player for Enhanced scatter, if so gain goes from 3 to 8
				if (actor.hasStatus(STATUSES.ENHANCED_SCATTER.id)) {
					//console.log('Enhanced Scatter On')
					if (isPre44) {
						white = ENHANCED_SCATTER_GAIN
						black = ENHANCED_SCATTER_GAIN
					} else {
						white = ENHANCED_SCATTER_44_GAIN
						black = ENHANCED_SCATTER_44_GAIN
					}
				}
			}

			if (event.amount === 0) {
				// Melee combo skills will still consume mana but will not continue the combo, set an invuln/missed flag for downstream consumers
				this.missOrInvuln = true

				if (white > 0 || black > 0) {
					// No mana gained from spells that do no damage due to missing or targeting an invulnerable boss (e.g. Omega M/F firewall)
					this.mana.white.invulnloss = white
					this.mana.black.invulnloss = black
					return
				}
			}
			this.mana.white.aftercast = this.mana.white.beforecast + white
			this.mana.black.aftercast = this.mana.black.beforecast + black

			this.calculateManaImbalance(white, black)
			this.calculateManaOvercap()
		}
	}

	calculateManaImbalance(white, black) {
		if (white && this.mana.black.beforecast - this.mana.white.beforecast > MANA_DIFFERENCE_THRESHOLD) {
			//console.log(`Imbalance White Lost, Current White: ${this._mana.white.beforecast} Current Black: ${this._mana.black.beforecast}`)
			//If we have more than 30 Black mana over White, our White gains are halved
			this.mana.white.imbalanceloss = Math.ceil(white / MANA_LOST_DIVISOR)
			this.mana.white.aftercast -= this.mana.white.imbalanceloss
		}

		if (black && this.mana.white.beforecast - this.mana.black.beforecast > MANA_DIFFERENCE_THRESHOLD) {
			//console.log(`Imbalance Black Lost, Current Black: ${this._mana.black.beforecast} Current White: ${this._mana.white.beforecast}`)
			//If we have more than 30 White mana over Black, our Black gains are halved
			this.mana.black.imbalanceloss = Math.ceil(black / MANA_LOST_DIVISOR)
			this.mana.black.aftercast -= this.mana.black.imbalanceloss
		}
	}

	calculateManaOvercap() {
		if (this.mana.white.aftercast > MANA_CAP) {
			this.mana.white.overcaploss = this.mana.white.aftercast - MANA_CAP
			this.mana.white.aftercast = MANA_CAP
		}

		if (this.mana.black.aftercast > MANA_CAP) {
			this.mana.black.overcaploss = this.mana.black.aftercast - MANA_CAP
			this.mana.black.aftercast = MANA_CAP
		}
	}
}

export default class Gauge extends Module {
		static handle = 'gauge'
		static i18n_id = i18nMark('rdm.gauge.title')
		static dependencies = [
			'combatants',
			'suggestions',
		]

		//Keeps track of our current mana gauge.
		_whiteMana = 0
		_blackMana = 0
		//Keeps track of overall wasted mana
		_whiteManaWasted = 0
		_blackManaWasted = 0

		_whiteManaLostToImbalance = 0
		_blackManaLostToImbalance = 0

		_whiteManaLostToInvulnerable = 0
		_blackManaLostToInvulnerable = 0

		// Chart handling
		_history = {
			white: [],
			black: [],
		}

		constructor(...args) {
			super(...args)

			this.addHook('cast', {
				by: 'player',
				abilityId: ACTIONS.MANAFICATION.id,
			}, this._onCast)
			this.addHook('damage', {by: 'player'}, this._onCast)
			this.addHook('death', {to: 'player'}, this._onDeath)
			this.addHook('complete', this._onComplete)
		}

		_pushToGraph() {
			const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
			this._history.white.push({t: timestamp, y: this._whiteMana})
			this._history.black.push({t: timestamp, y: this._blackMana})
		}

		_onCast(event) {
			const gaugeAction = new GaugeAction(this._whiteMana, this._blackMana)

			const abilityId = event.ability.guid
			//console.log(`White: ${this._whiteMana} Black: ${this._blackMana}`)
			if (abilityId === ACTIONS.MANAFICATION.id) {
				//console.log('Manafication')
				gaugeAction.calculateManaFicationManaGained()
			} else {
				gaugeAction.calculateCastManaGained(event, this.combatants.selected, this._getIsPre44)
			}

			this._whiteMana = gaugeAction.mana.white.aftercast
			this._blackMana = gaugeAction.mana.black.aftercast

			this._whiteManaWasted += gaugeAction.mana.white.overcaploss
			this._blackManaWasted += gaugeAction.mana.black.overcaploss

			this._whiteManaLostToImbalance += gaugeAction.mana.white.imbalanceloss
			this._blackManaLostToImbalance += gaugeAction.mana.black.imbalanceloss

			this._whiteManaLostToInvulnerable += gaugeAction.mana.white.invulnloss
			this._blackManaLostToInvulnerable += gaugeAction.mana.black.invulnloss

			if (abilityId in MANA_GAIN || abilityId === ACTIONS.MANAFICATION.id) {
				this._pushToGraph()
			}

			const fabricatedEvent = {
				...event,
				type: 'rdmCast',
				mana: gaugeAction.mana,
				missOrInvlun: gaugeAction.missOrInvuln,
			}
			//console.log(`${JSON.stringify(fabricatedEvent, null, 4)}`)
			this.parser.fabricateEvent(fabricatedEvent)
		}

		_onDeath() {
			this._whiteMana = 0
			this._blackMana = 0
			this._pushToGraph()
		}

		_onComplete() {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERHOLY.icon,
				content: <Fragment>
					<Trans id="rdm.gauge.suggestions.white-mana-wasted-content">Ensure you don't overcap your White Mana before a combo, overcapping White Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.</Trans>
				</Fragment>,
				tiers: SEVERITY_WASTED_MANA,
				value: this._whiteManaWasted,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.white-mana-wasted-why">You lost {this._whiteManaWasted} White Mana due to capped Gauge resources</Trans>
				</Fragment>,
			}))

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERHOLY.icon,
				content: <Fragment>
					<Trans id="rdm.gauge.suggestions.white-mana-lost-content">Ensure you don't allow a difference of more than 30 betwen mana types, you lost white Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos</Trans>
				</Fragment>,
				tiers: SEVERITY_LOST_MANA,
				value: this._whiteManaLostToImbalance,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.white-mana-lost-why">You lost {this._whiteManaLostToImbalance} White Mana due to overage of black Mana</Trans>
				</Fragment>,
			}))

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERHOLY.icon,
				content: <Fragment>
					<Trans id="rdm.gauge.suggestions.white-mana-invuln-content">Ensure you don't target a boss that you cannot damage (e.g. due to the Packet Filter debuffs in Omega M/F) with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
				</Fragment>,
				tiers: SEVERITY_LOST_MANA,
				value: this._whiteManaLostToInvulnerable,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.white-mana-invuln-why">You lost {this._whiteManaLostToInvulnerable} White Mana due to misses or spells that targeted an invulnerable target</Trans>
				</Fragment>,
			}))

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERFLARE.icon,
				content: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-wasted-content">Ensure you don't overcap your Black Mana before a combo, overcapping Black Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.</Trans>
				</Fragment>,
				tiers: SEVERITY_WASTED_MANA,
				value: this._blackManaWasted,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-wasted-why">You lost {this._blackManaWasted} Black Mana due to capped Gauge resources</Trans>
				</Fragment>,
			}))

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERFLARE.icon,
				content: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-lost-content">Ensure you don't allow a difference of more than 30 betwen mana types, you lost Black Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos</Trans>
				</Fragment>,
				tiers: SEVERITY_LOST_MANA,
				value: this._blackManaLostToImbalance,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-lost-why">You lost {this._blackManaLostToImbalance} Black Mana due to overage of White Mana</Trans>
				</Fragment>,
			}))

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERFLARE.icon,
				content: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-invuln-content">Ensure you don't target a boss that you cannot damage (e.g. due to the Packet Filter debuffs in Omega M/F) with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
				</Fragment>,
				tiers: SEVERITY_LOST_MANA,
				value: this._blackManaLostToInvulnerable,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-invuln-why">You lost {this._blackManaLostToInvulnerable} Black Mana due to misses or spells that targeted an invulnerable target</Trans>
				</Fragment>,
			}))
		}

		output() {
			const whm = Color(JOBS.WHITE_MAGE.colour)
			const blm = Color(JOBS.BLACK_MAGE.colour)

			// Disabling magic numbers for the chart, 'cus it's a chart
			/* eslint-disable no-magic-numbers */
			const data = {
				datasets: [{
					label: 'White Mana',
					data: this._history.white,
					backgroundColor: whm.fade(0.5),
					borderColor: whm.fade(0.2),
					steppedLine: true,
				}, {
					label: 'Black Mana',
					data: this._history.black,
					backgroundColor: blm.fade(0.5),
					borderColor: blm.fade(0.2),
					steppedLine: true,
				}],
			}
			return <TimeLineChart
				data={data}
			/>
			/* eslint-enable no-magic-numbers */
		}

		/**
 		* Get the current White Mana as calculated from the most recent OnCast event
 		*/
		get whiteMana() {
			return this._whiteMana
		}

		/**
		* Get the current Black Mana as calculated from the most recent OnCast event
		*/
		get blackMana() {
			return this._blackMana
		}

		get _getIsPre44() {
			const currentParseDate = getPatch(this.parser.parseDate)
			// The report timestamp is relative to the report timestamp, and in ms. Convert.
			return PATCHES[currentParseDate].date < PATCHES['4.4'].date
		}
}
