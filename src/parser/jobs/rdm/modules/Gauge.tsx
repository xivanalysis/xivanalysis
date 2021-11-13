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

export const MANA_DIFFERENCE_THRESHOLD = 30
export const MANA_CAP = 100

export class Gauge extends CoreGauge {
	static override title = t('rdm.gauge.title')`Mana Gauge Usage`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private statistics!: Statistics

	private whiteManaGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="rdm.gauge.resource.whitemana">White Mana</Trans>,
			color: JOBS.WHITE_MAGE.colour,
		},
		maximum: 100,
		minimum: 0,
	}))
	private blackManaGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="rdm.gauge.resource.blackmana">Black Mana</Trans>,
			color: JOBS.BLACK_MAGE.colour,
		},
		maximum: 100,
		minimum: 0,
	}))
	public gaugeModifiers = new Map<number, GaugeModifier>([
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
	public spenderModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.ENCHANTED_REPRISE.id, {white: -5, black: -5}],
		[this.data.actions.ENCHANTED_MOULINET.id, {white: -20, black: -20}],
		[this.data.actions.ENCHANTED_RIPOSTE.id, {white: -30, black: -30}],
		[this.data.actions.ENCHANTED_ZWERCHHAU.id, {white: -25, black: -25}],
		[this.data.actions.ENCHANTED_REDOUBLEMENT.id, {white: -25, black: -25}],
	])
	private severityWastedMana = {
		1: SEVERITY.MINOR,
		20: SEVERITY.MEDIUM,
		80: SEVERITY.MAJOR,
	}
	private severityLostMana = {
		1: SEVERITY.MINOR,
		20: SEVERITY.MEDIUM,
		80: SEVERITY.MAJOR,
	}

	private readonly manaLostDivisor = 2
	private readonly manaficationMultiplier = 2

	manaStatistics = {
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
				.action(oneOf(Array.from(this.spenderModifiers.keys()))),
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
		const modifier = this.gaugeModifiers.get(event.cause.action)

		if (modifier == null) {
			return
		}

		const amount = modifier
		const penalized = this.isOutOfBalance()
		const whiteModified = penalized.white ? Math.floor(amount.white/ this.manaLostDivisor) : amount.white
		const blackModified = penalized.black ? Math.floor(amount.black/ this.manaLostDivisor) : amount.black

		if (!isSuccessfulHit(event)) {
			//Then we lost this mana, add to statistics and move along.
			this.manaStatistics.white.invulnLoss += whiteModified
			this.manaStatistics.black.invulnLoss += blackModified
			return
		}

		this.whiteManaGauge.modify(whiteModified)
		this.blackManaGauge.modify(blackModified)
		//Statistics Gathering
		this.manaStatistics.white.imbalanceLoss += amount.white - whiteModified
		this.manaStatistics.black.imbalanceLoss += amount.black - blackModified
	}

	private onManafication() {
		let whiteModifier = this.getWhiteMana() *  this.manaficationMultiplier
		let blackModifier = this.getBlackMana() *  this.manaficationMultiplier

		//Now calculate and store overcap if any.  This way we can still utilize the Overcap
		//From core, but track this loss separately.
		//In EW we will still track this separately even though it will no longer be a multiplier but flat 50|50
		if (whiteModifier > MANA_CAP) 		{
			this.manaStatistics.white.manaficationLoss = whiteModifier - MANA_CAP
			whiteModifier = MANA_CAP
		}

		if (blackModifier > MANA_CAP) {
			this.manaStatistics.black.manaficationLoss = blackModifier - MANA_CAP
			blackModifier = MANA_CAP
		}

		this.whiteManaGauge.set(whiteModifier)
		this.blackManaGauge.set(blackModifier)
	}

	private onGaugeSpender(event: Events['action']) {
		const modifier =  this.spenderModifiers.get(event.action)

		if (modifier == null) {
			return
		}
		const amount = modifier

		this.whiteManaGauge.modify(amount.white)
		this.blackManaGauge.modify(amount.black)
	}

	//Returns which Mana should be penalized, white, black, or neither
	private isOutOfBalance() : {white: boolean, black: boolean} {
		const whiteMana = this.getWhiteMana()
		const blackMana = this.getBlackMana()

		if (whiteMana && (blackMana - whiteMana >  MANA_DIFFERENCE_THRESHOLD)) {
			//If we have more than 30 Black Mana over White, our White gains are halved.
			return {white: true, black: false}
		}

		if (blackMana && (whiteMana - blackMana>  MANA_DIFFERENCE_THRESHOLD)) {
			//If we have more than 30 White Mana over Black, our Black gains are halved
			return {white: false, black: true}
		}

		return {white: false, black: false}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.whiteManaGauge.overCap > this.blackManaGauge.overCap ? this.data.actions.VERHOLY.icon : this.data.actions.VERFLARE.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.mana-wasted-content">Ensure you don't overcap your White Mana before a combo, overcapping White Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.</Trans>
			</Fragment>,
			tiers:  this.severityWastedMana,
			value:  this.whiteManaGauge.overCap + this.blackManaGauge.overCap,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.mana-wasted-why">You lost { this.whiteManaGauge.overCap} White Mana and {this.blackManaGauge.overCap} Black Mana due to capped Gauge resources</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.manaStatistics.white.imbalanceLoss > this.manaStatistics.black.imbalanceLoss ? this.data.actions.VERHOLY.icon : this.data.actions.VERFLARE.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.mana-lost-content">Ensure you don't allow a difference of more than 30 betwen mana types, you lost white Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos</Trans>
			</Fragment>,
			tiers:  this.severityLostMana,
			value:  this.manaStatistics.white.imbalanceLoss + this.manaStatistics.black.imbalanceLoss,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.mana-lost-why">You lost { this.manaStatistics.white.imbalanceLoss} White Mana and { this.manaStatistics.black.imbalanceLoss} Black Mana due to overage of black Mana</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.manaStatistics.white.invulnLoss > this.manaStatistics.black.invulnLoss ? this.data.actions.VERHOLY.icon : this.data.actions.VERFLARE.icon,
			content: <Fragment>
				<Trans id="rdm.gauge.suggestions.mana-invuln-content">Ensure you don't target a boss that you cannot damage with your damaging spells.  Spells that do no damage due to an invulnerable target or due to missing result in no mana gained, which potentially costs you one or more Enchanted Combos.</Trans>
			</Fragment>,
			tiers:  this.severityLostMana,
			value:  this.manaStatistics.white.invulnLoss + this.manaStatistics.black.invulnLoss,
			why: <Fragment>
				<Trans id="rdm.gauge.suggestions.mana-invuln-why">You lost { this.manaStatistics.white.invulnLoss} White Mana and { this.manaStatistics.black.invulnLoss} Black Mana due to misses or spells that targeted an invulnerable target</Trans>
			</Fragment>,
		}))

		this.statistics.add(new DualStatistic({
			label: <Trans id="rdm.gauge.title-mana-lost-to-manafication">Manafication Loss:</Trans>,
			title: <Trans id="rdm.gauge.white-mana-lost-to-manafication">White</Trans>,
			title2: <Trans id="rdm.gauge.black-mana-lost-to-manafication">Black</Trans>,
			icon: this.data.actions.VERHOLY.icon,
			icon2: this.data.actions.VERFLARE.icon,
			value:  this.manaStatistics.white.manaficationLoss,
			value2:  this.manaStatistics.black.manaficationLoss,
			info: (
				<Trans id="rdm.gauge.white-mana-lost-to-manafication-statistics">
					It is ok to lose some mana to manafication over the course of a fight, you should however strive to keep this number as low as possible.
				</Trans>
			),
		}))
	}

	public getWhiteMana() {
		return  this.whiteManaGauge.value
	}

	public getWhiteManaAt(timestamp: number) {
		return  this.whiteManaGauge.getValueAt(timestamp)
	}

	public getBlackMana() {
		return  this.blackManaGauge.value
	}

	public getBlackManaAt(timestamp: number) {
		return  this.blackManaGauge.getValueAt(timestamp)
	}
}
