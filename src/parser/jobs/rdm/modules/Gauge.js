import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import React, {Fragment} from 'react'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'
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
	[ACTIONS.VERAERO_II.id]: {white: 7, black: 0},
	[ACTIONS.VERTHUNDER_II.id]: {white: 0, black: 7},
	[ACTIONS.IMPACT.id]: {white: 3, black: 3},
	[ACTIONS.ENCHANTED_RIPOSTE.id]: {white: -30, black: -30},
	[ACTIONS.ENCHANTED_ZWERCHHAU.id]: {white: -25, black: -25},
	[ACTIONS.ENCHANTED_REDOUBLEMENT.id]: {white: -25, black: -25},
	[ACTIONS.ENCHANTED_MOULINET.id]: {white: -20, black: -20},
	[ACTIONS.ENCHANTED_REPRISE.id]: {white: -5, black: -5},
	[ACTIONS.SCORCH.id]: {white: 7, black: 7},
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
const MANAFICATION_MULTIPLIER = 2
const MANA_FLOOR = 0

class GaugeAction {
	mana = {
		white: {
			beforeCast: 0,
			afterCast: 0,
			overCapLoss: 0,
			imbalanceLoss: 0,
			invulnLoss: 0,
			manaficationLoss: 0,
		},
		black: {
			beforeCast: 0,
			afterCast: 0,
			overCapLoss: 0,
			imbalanceLoss: 0,
			invulnLoss: 0,
			manaficationLoss: 0,
		},
	}

	constructor(startingWhite, startingBlack) {
		this.mana.white.beforeCast = startingWhite
		this.mana.black.beforeCast = startingBlack

		this.mana.white.afterCast = startingWhite
		this.mana.black.afterCast = startingBlack
	}

	calculateManaFicationManaGained() {
		this.mana.white.afterCast = this.mana.white.beforeCast * MANAFICATION_MULTIPLIER
		this.mana.black.afterCast = this.mana.black.beforeCast * MANAFICATION_MULTIPLIER

		this.calculateManaOvercap(true)
	}

	calculateCastManaGained(event) {
		//Determine if the ability we used should yield any mana gain.
		//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
		//console.log(`Ability: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
		const abilityId = event.ability.guid
		const {white, black} = MANA_GAIN[abilityId] || {}
		if (white || black) {
			if (!event.successfulHit) {
				// Melee combo skills will still consume mana but will not continue the combo, set an invuln/missed flag for downstream consumers
				this.missOrInvuln = true

				if (white > 0 || black > 0) {
					// No mana gained from spells that do no damage due to missing or targeting an invulnerable boss (e.g. Omega M/F firewall)
					this.mana.white.invulnLoss = white
					this.mana.black.invulnLoss = black
					return
				}
			}
			this.mana.white.afterCast = this.mana.white.beforeCast + white
			this.mana.black.afterCast = this.mana.black.beforeCast + black

			this.calculateManaImbalance(white, black)
			this.calculateManaOvercap(false)
		}
	}

	calculateManaImbalance(white, black) {
		if (white && this.mana.black.beforeCast - this.mana.white.beforeCast > MANA_DIFFERENCE_THRESHOLD) {
			//console.log(`Imbalance White Lost, Current White: ${this._mana.white.beforecast} Current Black: ${this._mana.black.beforecast}`)
			//If we have more than 30 Black mana over White, our White gains are halved
			this.mana.white.imbalanceLoss = Math.ceil(white / MANA_LOST_DIVISOR)
			this.mana.white.afterCast -= this.mana.white.imbalanceLoss
		}

		if (black && this.mana.white.beforeCast - this.mana.black.beforeCast > MANA_DIFFERENCE_THRESHOLD) {
			//console.log(`Imbalance Black Lost, Current Black: ${this._mana.black.beforecast} Current White: ${this._mana.white.beforecast}`)
			//If we have more than 30 White mana over Black, our Black gains are halved
			this.mana.black.imbalanceLoss = Math.ceil(black / MANA_LOST_DIVISOR)
			this.mana.black.afterCast -= this.mana.black.imbalanceLoss
		}
	}

	calculateManaOvercap(isManafication) {
		if (this.mana.white.afterCast > MANA_CAP) {
			if (isManafication) {
				this.mana.white.manaficationLoss = this.mana.white.afterCast - MANA_CAP
			} else {
				this.mana.white.overCapLoss = this.mana.white.afterCast - MANA_CAP
			}
			this.mana.white.afterCast = MANA_CAP
		}

		if (this.mana.black.afterCast > MANA_CAP) {
			if (isManafication) {
				this.mana.black.manaficationLoss = this.mana.black.afterCast - MANA_CAP
			} else {
				this.mana.black.overCapLoss = this.mana.black.afterCast - MANA_CAP
			}
			this.mana.black.afterCast = MANA_CAP
		}
	}
}

export default class Gauge extends Module {
		static handle = 'gauge'
		static title = t('rdm.gauge.title')`Gauge`
		static dependencies = [
			'cooldowns',
			'suggestions',
			'statistics',
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

		_whiteManaLostToManafication = 0
		_blackManaLostToManafication = 0

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
			}, this._gaugeEvent)
			this.addHook('aoedamage', {by: 'player'}, this._gaugeEvent)
			this.addHook('death', {to: 'player'}, this._onDeath)
			this.addHook('complete', this._onComplete)
		}

		_pushToGraph() {
			const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
			this._history.white.push({t: timestamp, y: this._whiteMana})
			this._history.black.push({t: timestamp, y: this._blackMana})
		}

		_gaugeEvent(event) {
			//If the RDM had resources going into the fight eventually we'll hit a negative number.
			//This is very bad, so what we'll do is before we initialize the Action or any calculations we'll insure the base
			//Inputs are at the Floor of 0.
			if (this._whiteMana && this._whiteMana < MANA_FLOOR) {
				this._whiteMana = MANA_FLOOR
			}

			if (this._blackMana && this._blackMana < MANA_FLOOR) {
				this._blackMana = MANA_FLOOR
			}

			const gaugeAction = new GaugeAction(this._whiteMana, this._blackMana)

			const abilityId = event.ability.guid
			//console.log(`White: ${this._whiteMana} Black: ${this._blackMana}`)
			if (abilityId === ACTIONS.MANAFICATION.id) {
				//console.log('Manafication')
				gaugeAction.calculateManaFicationManaGained()

				// Manafication resets movement abilities
				this.cooldowns.resetCooldown(ACTIONS.CORPS_A_CORPS.id)
				this.cooldowns.resetCooldown(ACTIONS.DISPLACEMENT.id)
			} else {
				//Leaving this here, we have an issue where in an overkill returns an amount of 0
				//But the game treats it as an ability that hit, this causes a trigger of our invuln logic
				//Sadly removing the amount check would cause even more inaccurate information to go out.
				//This log shows the issue with verthunder overkill of mustardseed 1 (ID 21), Verholy overkill of mustardseed 2 (ID 25)
				//And a verthunder overkill of Titania herself.  https://www.fflogs.com/reports/FkVjcbGqBhXyNtg7/#fight=6&type=summary
				// if (event.amount === 0) {
				// 	console.log(`${JSON.stringify(event, null, 4)}`)
				// 	console.log(`Cast: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
				// }
				gaugeAction.calculateCastManaGained(event)
			}

			this._whiteMana = gaugeAction.mana.white.afterCast
			this._blackMana = gaugeAction.mana.black.afterCast

			this._whiteManaWasted += gaugeAction.mana.white.overCapLoss
			this._blackManaWasted += gaugeAction.mana.black.overCapLoss

			this._whiteManaLostToImbalance += gaugeAction.mana.white.imbalanceLoss
			this._blackManaLostToImbalance += gaugeAction.mana.black.imbalanceLoss

			this._whiteManaLostToInvulnerable += gaugeAction.mana.white.invulnLoss
			this._blackManaLostToInvulnerable += gaugeAction.mana.black.invulnLoss

			this._whiteManaLostToManafication += gaugeAction.mana.white.manaficationLoss
			this._blackManaWastedToManafication += gaugeAction.mana.black.manaficationLoss

			if (abilityId in MANA_GAIN || abilityId === ACTIONS.MANAFICATION.id) {
				this._pushToGraph()
			}

			const fabricatedEvent = {
				...event,
				type: 'rdmcast',
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
					<Trans id="rdm.gauge.suggestions.white-mana-invuln-content">Ensure you don't target a boss that you cannot damage with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
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
					<Trans id="rdm.gauge.suggestions.black-mana-invuln-content">Ensure you don't target a boss that you cannot damage with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
				</Fragment>,
				tiers: SEVERITY_LOST_MANA,
				value: this._blackManaLostToInvulnerable,
				why: <Fragment>
					<Trans id="rdm.gauge.suggestions.black-mana-invuln-why">You lost {this._blackManaLostToInvulnerable} Black Mana due to misses or spells that targeted an invulnerable target</Trans>
				</Fragment>,
			}))

			this.statistics.add(new DualStatistic({
				label: <Trans id="rdm.gauge.title-mana-lost-to-manafication">Manafication Loss:</Trans>,
				title: <Trans id="rdm.gauge.white-mana-lost-to-manafication">White</Trans>,
				title2: <Trans id="rdm.gauge.black-mana-lost-to-manafication">Black</Trans>,
				icon: ACTIONS.VERHOLY.icon,
				icon2: ACTIONS.VERFLARE.icon,
				value: this._whiteManaLostToManafication,
				value2: this._blackManaLostToManafication,
				info: (
					<Trans id="rdm.gauge.white-mana-lost-to-manafication-statistics">
						It is ok to lose some mana to manafication over the course of a fight, you should however strive to keep this number as low as possible.
					</Trans>
				),
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
}
