import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {isSuccessfulHit} from 'utilities'

interface GaugeModifier {
	white: number
	black: number
}

export const MANA_DIFFERENCE_THRESHOLD = 30
export const MANA_CAP = 100

export class ManaGauge extends CoreGauge {
	static override title = t('rdm.gauge.title')`Mana Gauge Usage`

	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

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
		[this.data.actions.VERAERO.id, {white: 6, black: 0}],
		[this.data.actions.VERAERO_II.id, {white: 7, black: 0}],
		[this.data.actions.VERAERO_III.id, {white: 6, black: 0}],
		[this.data.actions.VERSTONE.id, {white: 5, black: 0}],
		[this.data.actions.VERHOLY.id, {white: 11, black: 0}],
		[this.data.actions.VERTHUNDER.id, {white: 0, black: 6}],
		[this.data.actions.VERTHUNDER_II.id, {white: 0, black: 7}],
		[this.data.actions.VERTHUNDER_III.id, {white: 0, black: 6}],
		[this.data.actions.VERFIRE.id, {white: 0, black: 5}],
		[this.data.actions.VERFLARE.id, {white: 0, black: 11}],
		[this.data.actions.JOLT.id, {white: 2, black: 2}],
		[this.data.actions.JOLT_II.id, {white: 2, black: 2}],
		[this.data.actions.JOLT_III.id, {white: 2, black: 2}],
		[this.data.actions.SCATTER.id, {white: 3, black: 3}],
		[this.data.actions.IMPACT.id, {white: 3, black: 3}],
		[this.data.actions.GRAND_IMPACT.id, {white: 3, black: 3}],
		[this.data.actions.SCORCH.id, {white: 4, black: 4}],
		[this.data.actions.RESOLUTION.id, {white: 4, black: 4}],
	])
	public spenderModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.ENCHANTED_REPRISE.id, {white: -5, black: -5}],
		[this.data.actions.ENCHANTED_MOULINET.id, {white: -20, black: -20}],
		[this.data.actions.ENCHANTED_MOULINET_DEUX.id, {white: -15, black: -15}],
		[this.data.actions.ENCHANTED_MOULINET_TROIS.id, {white: -15, black: -15}],
		[this.data.actions.ENCHANTED_RIPOSTE.id, {white: -20, black: -20}],
		[this.data.actions.ENCHANTED_ZWERCHHAU.id, {white: -15, black: -15}],
		[this.data.actions.ENCHANTED_REDOUBLEMENT.id, {white: -15, black: -15}],
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

	manaStatistics = {
		white: {
			imbalanceLoss: 0,
			invulnLoss: 0,
		},
		black: {
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

	private onGaugeSpender(event: Events['action']) {
		const modifier =  this.spenderModifiers.get(event.action)

		if (modifier == null) {
			return
		}
		const amount = modifier

		//Magicked SwordPlay enables us to use our combo without expending mana, the order of eventing
		//Is Action --> Status change, so in any circumstance the attack should always happen before the buff removal
		if (this.actors.current.at(event.timestamp).hasStatus(this.data.statuses.MAGICKED_SWORDPLAY.id)) {
			//Then don't spend.
			return
		}

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
				<Trans id="rdm.gauge.suggestions.mana-wasted-content">Ensure you don't overcap your Mana before a combo; overcapping Mana indicates your balance was off, and you potentially lost out on Enchanted Combo damage.</Trans>
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
				<Trans id="rdm.gauge.suggestions.mana-lost-content">Ensure you don't allow a difference of more than 30 betwen mana types. You lost Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos.</Trans>
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
