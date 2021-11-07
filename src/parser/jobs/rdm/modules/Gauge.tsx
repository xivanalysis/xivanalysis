import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import JOBS from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'
import React, {Fragment} from 'react'
import {isSuccessfulHit} from 'utilities'

interface GaugeModifier {
	white: number
	black: number
}

export default class Gauge extends CoreGauge {
	static override title = t('rdm.gauge.title')`Mana Gauge Usage`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private statistics!: Statistics

	private _whiteManaGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="rdm.gauge.resource.whitemana">White Mana</Trans>,
			color: JOBS.WHITE_MAGE.colour,
		},
		maximum: 100,
		minimum: 0,
	}))
	private _blackManaGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="rdm.gauge.resource.blackmana">Black Mana</Trans>,
			color: JOBS.BLACK_MAGE.colour,
		},
		maximum: 100,
		minimum: 0,
	}))
	public _gaugeModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.VERAERO.id, {white: 11, black: 0}],
		[this.data.actions.VERAERO_II.id, {white: 7, black: 0}],
		[this.data.actions.VERSTONE.id, {white: 9, black: 0}],
		[this.data.actions.VERHOLY.id, {white: 21, black: 0}],
		[this.data.actions.VERTHUNDER.id, {white: 0, black: 11}],
		[this.data.actions.VERTHUNDER_II.id, {white: 0, black: 7}],
		[this.data.actions.VERFIRE.id, {white: 0, black: 9}],
		[this.data.actions.VERFLARE.id, {white: 0, black: 21}],
		[this.data.actions.JOLT.id, {white: 3, black: 3}],
		[this.data.actions.JOLT_II.id, {white: 3, black: 3}],
		[this.data.actions.IMPACT.id, {white: 3, black: 3}],
		[this.data.actions.SCORCH.id, {white: 7, black: 7}],
	])
	private _spenderModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.ENCHANTED_REPRISE.id, {white: -5, black: -5}],
		[this.data.actions.ENCHANTED_MOULINET.id, {white: -20, black: -20}],
		[this.data.actions.ENCHANTED_RIPOSTE.id, {white: -30, black: -30}],
		[this.data.actions.ENCHANTED_ZWERCHHAU.id, {white: -25, black: -25}],
		[this.data.actions.ENCHANTED_REDOUBLEMENT.id, {white: -25, black: -25}],
	])
	private _severityWastedMana = {
		1: SEVERITY.MINOR,
		20: SEVERITY.MEDIUM,
		80: SEVERITY.MAJOR,
	}
	private _severityLostMana = {
		1: SEVERITY.MINOR,
		20: SEVERITY.MEDIUM,
		80: SEVERITY.MAJOR,
	}
	public readonly _manaDifferenceThreshold = 30
	private readonly _manaLostDivisor = 2
	private readonly _manaficationMultiplier = 2
	public readonly _manaCap = 100

	_manaStatistics = {
		white: {
			manaficationLoss: 0,
			imbalanceLoss: 0,
			invulnLoss: 0,
		},
		black: {
			manaficationLoss: 0,
			imbalanceLoss: 0,
			invulnLoss: 0,
		},
	}

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.type('damage')
				.source(this.parser.actor.id),
			this.onGaugeModifying
		)
		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(oneOf(Array.from(this._spenderModifiers.keys()))),
			this.onGaugeSpender
		)
		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(this.data.actions.MANAFICATION.id),
			this.onManafication
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifying(event: Events['damage']) {
		if (event.cause.type !== 'action') {
			return
		}
		const modifier = this._gaugeModifiers.get(event.cause.action)

		if (modifier == null) {
			return
		}

		const amount = modifier
		const penalized = this.isOutOfBalance()
		const whiteModified = penalized.white ? Math.ceil(amount.white/this._manaLostDivisor) : amount.white
		const blackModified = penalized.black ? Math.ceil(amount.black/this._manaLostDivisor) : amount.black

		if (!isSuccessfulHit(event)) {
			//Then we lost this mana, add to statistics and move along.
			this._manaStatistics.white.invulnLoss = whiteModified
			this._manaStatistics.black.invulnLoss = blackModified
			return
		}

		this._whiteManaGauge.modify(whiteModified)
		this._blackManaGauge.modify(blackModified)
		//Statistics Gathering
		if (penalized.white) {
			this._manaStatistics.white.imbalanceLoss = whiteModified
		}
		if (penalized.black) {
			this._manaStatistics.black.imbalanceLoss = blackModified
		}

	}

	private onManafication() {
		let whiteModifier = this.getWhiteMana() * this._manaficationMultiplier
		let blackModifier = this.getBlackMana() * this._manaficationMultiplier

		//Now calculate and store overcap if any.  This way we can still utilize the Overcap
		//From core, but track this loss separately.
		//In EW we will still track this separately even though it will no longer be a multiplier but flat 50|50
		if (whiteModifier > this._manaCap) 		{
			this._manaStatistics.white.manaficationLoss = whiteModifier - this._manaCap
			whiteModifier = this._manaCap
		}

		if (blackModifier > this._manaCap) {
			this._manaStatistics.black.manaficationLoss = blackModifier - this._manaCap
			blackModifier = this._manaCap
		}

		this._whiteManaGauge.set(whiteModifier)
		this._blackManaGauge.set(blackModifier)
	}

	private onGaugeSpender(event: Events['action']) {
		const modifier = this._spenderModifiers.get(event.action)

		if (modifier == null) {
			return
		}
		const amount = modifier

		this._whiteManaGauge.modify(amount.white)
		this._blackManaGauge.modify(amount.black)
	}

	//Returns which Mana should be penalized, white, black, or neither
	private isOutOfBalance() : {white: boolean, black: boolean} {
		const whiteMana = this.getWhiteMana()
		const blackMana = this.getBlackMana()

		if (whiteMana && (blackMana - whiteMana > this._manaDifferenceThreshold)) {
			//If we have more than 30 Black Mana over White, our White gains are halved.
			return {white: true, black: false}
		}

		if (blackMana && (whiteMana - blackMana> this._manaDifferenceThreshold)) {
			//If we have more than 30 White Mana over Black, our Black gains are halved
			return {white: false, black: true}
		}

		return {white: false, black: false}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERHOLY.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.white-mana-wasted-content">Ensure you don't overcap your White Mana before a combo, overcapping White Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.</Trans>
			</Fragment>,
			tiers: this._severityWastedMana,
			value: this._whiteManaGauge.overCap,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.white-mana-wasted-why">You lost {this._whiteManaGauge.overCap} White Mana due to capped Gauge resources</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERHOLY.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.white-mana-lost-content">Ensure you don't allow a difference of more than 30 betwen mana types, you lost white Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos</Trans>
			</Fragment>,
			tiers: this._severityLostMana,
			value: this._manaStatistics.white.imbalanceLoss,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.white-mana-lost-why">You lost {this._manaStatistics.white.imbalanceLoss} White Mana due to overage of black Mana</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERHOLY.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.white-mana-invuln-content">Ensure you don't target a boss that you cannot damage with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
			</Fragment>,
			tiers: this._severityLostMana,
			value: this._manaStatistics.white.invulnLoss,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.white-mana-invuln-why">You lost {this._manaStatistics.white.invulnLoss} White Mana due to misses or spells that targeted an invulnerable target</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERFLARE.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.black-mana-wasted-content">Ensure you don't overcap your Black Mana before a combo, overcapping Black Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.</Trans>
			</Fragment>,
			tiers: this._severityWastedMana,
			value: this._blackManaGauge.overCap,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.black-mana-wasted-why">You lost {this._blackManaGauge.overCap} Black Mana due to capped Gauge resources</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERFLARE.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.black-mana-lost-content">Ensure you don't allow a difference of more than 30 betwen mana types, you lost Black Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos</Trans>
			</Fragment>,
			tiers: this._severityLostMana,
			value: this._manaStatistics.black.imbalanceLoss,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.black-mana-lost-why">You lost {this._manaStatistics.black.imbalanceLoss} Black Mana due to overage of White Mana</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VERFLARE.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.black-mana-invuln-content">Ensure you don't target a boss that you cannot damage with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
			</Fragment>,
			tiers: this._severityLostMana,
			value: this._manaStatistics.black.invulnLoss,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.black-mana-invuln-why">You lost {this._manaStatistics.black.invulnLoss} Black Mana due to misses or spells that targeted an invulnerable target</Trans>
			</Fragment>,
		}))

		this.statistics.add(new DualStatistic({
			label: <Trans id="rdm.gauge.title-mana-lost-to-manafication">Manafication Loss:</Trans>,
			title: <Trans id="rdm.gauge.white-mana-lost-to-manafication">White</Trans>,
			title2: <Trans id="rdm.gauge.black-mana-lost-to-manafication">Black</Trans>,
			icon: this.data.actions.VERHOLY.icon,
			icon2: this.data.actions.VERFLARE.icon,
			value: this._manaStatistics.white.manaficationLoss,
			value2: this._manaStatistics.black.manaficationLoss,
			info: (
				<Trans id="rdm.gauge.white-mana-lost-to-manafication-statistics">
					It is ok to lose some mana to manafication over the course of a fight, you should however strive to keep this number as low as possible.
				</Trans>
			),
		}))
	}

	public getWhiteMana() {
		return this._whiteManaGauge.value
	}

	public getWhiteManaAt(timestamp: number) {
		return this._whiteManaGauge.getValueAt(timestamp)
	}

	public getBlackMana() {
		return this._blackManaGauge.value
	}

	public getBlackManaAt(timestamp: number) {
		return this._blackManaGauge.getValueAt(timestamp)
	}
}
