import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import AdditionalStats from './AdditionalStats'

const DHIT_MOD = 1.25
const TRAIT_STRENGTH = 0.20
const APEX_POTENCY_THRESHOLDS = {
	singleTarget: 255, // below this is worse than a BS/RA
	multiTarget: 189, // below this is worse than a QN (+ BL reset)
}

export default class ApexArrow extends Module {
	static override handle = 'Apex'
	static override title = t('brd.apex.title')`Apex Arrow`
	static override debug = false

	@dependency private stats!: AdditionalStats
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private ghostedApexCasts: number = 0
	private badApexCasts: number = 0

	protected override init() {
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.data.actions.APEX_ARROW.id}, this.onApex)
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Summons the yumicode, hopefully this will be rewritten at some point but for now it's a necessary evil
	 */
	private getRawDamage(event: NormalisedDamageEvent): number {
		if (!event.multiplier) { return 0 }

		const fixedMultiplier = Math.trunc((event.multiplier + TRAIT_STRENGTH) * 100) / 100

		const bestEvent = event.confirmedEvents.reduce((max, curr) =>
			(curr.amount > max.amount ? curr : max), event.confirmedEvents[0])

		// We get the unbuffed damage
		let rawDamage = (bestEvent.amount + (bestEvent.overkill ?? 0)) / fixedMultiplier

		// And then strip off critical hit and direct hit mods
		if (bestEvent.criticalHit) {
			rawDamage = Math.trunc(rawDamage / this.stats.critMod)
		}

		if (bestEvent.directHit) {
			rawDamage = Math.trunc(rawDamage / DHIT_MOD)
		}
		return rawDamage
	}

	private onApex(event: NormalisedDamageEvent) {
		if (event.confirmedEvents.length === 0) {
			this.ghostedApexCasts++
			return
		}

		const potencyDamageRatio = this.stats.potencyDamageRatio
		const rawDamage = this.getRawDamage(event)
		const approximatedPotency = rawDamage * 100 / potencyDamageRatio

		this.debug('Apex Event', {
			timestamp: event.timestamp,
			potency: approximatedPotency,
			hitCount: event.hitCount,
		})

		if ((event.hitCount === 1 && approximatedPotency < APEX_POTENCY_THRESHOLDS.singleTarget) ||
			(event.hitCount > 1 && approximatedPotency < APEX_POTENCY_THRESHOLDS.multiTarget)) {
			this.badApexCasts++
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.APEX_ARROW.icon,
			content: <Trans id="brd.apex.suggestions.ghost.content">
				Avoid using <ActionLink {...this.data.actions.APEX_ARROW} /> when the target is about to disappear.
			</Trans>,
			why: <Trans id="brd.apex.suggestions.ghost.why">
				Apex Arrow ghosted and dealt no damage <Plural value={this.ghostedApexCasts} one="# time" other="# times"/>.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this.ghostedApexCasts,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.APEX_ARROW.icon,
			content: <Trans id="brd.apex.suggestions.bad.content">
				Avoid using <ActionLink {...this.data.actions.APEX_ARROW} /> without a sufficient amount of Soul Voice.
			</Trans>,
			why: <Trans id="brd.apex.suggestions.bad.why">
				Apex Arrow dealt very low damage <Plural value={this.badApexCasts} one="# time" other="# times"/>.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this.badApexCasts,
		}))
	}
}
