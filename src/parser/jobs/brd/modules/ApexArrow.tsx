import React from 'react'
import {Trans, Plural} from '@lingui/react'
import {t} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {DamageEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import AdditionalStats from './AdditionalStats'

const DHIT_MOD = 1.25
const TRAIT_STRENGTH = 0.20
const APEX_POTENCY_THRESHOLDS = {
	singleTarget: 255, // below this is worse than a BS/RA
	multiTarget: 189, // below this is worse than a QN (+ BL reset)
}

export default class ApexArrow extends Module {
	static handle = 'Apex'
	static title = t('brd.apex.title')`Apex Arrow`

	@dependency private stats!: AdditionalStats
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private ghostedApexCasts: number = 0
	private badApexCasts: number = 0

	protected init() {
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.data.actions.APEX_ARROW.id}, this.onApex)
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Summons the yumicode, hopefully this will be rewritten at some point but for now it's a necessary evil
	 */
	private getRawDamage(event: DamageEvent): number {
		if (!event.debugMultiplier) { return 0 }

		const fixedMultiplier = Math.trunc((event.debugMultiplier + TRAIT_STRENGTH) * 100) / 100

		// We get the unbuffed damage
		let rawDamage = event.amount / fixedMultiplier

		// And then strip off critical hit and direct hit mods
		if (event.criticalHit) {
			rawDamage = Math.trunc(rawDamage / this.stats.critMod)
		}

		if (event.directHit) {
			rawDamage = Math.trunc(rawDamage / DHIT_MOD)
		}
		return rawDamage
	}

	private onApex(event: NormalisedDamageEvent) {
		if (event.hitCount === 0) {
			this.ghostedApexCasts++
			return
		}

		const potencyDamageRatio = this.stats.potencyDamageRatio
		const rawDamage = this.getRawDamage(event.confirmedEvents[0])
		const approximatedPotency = rawDamage * 100 / potencyDamageRatio

		this.debug(approximatedPotency)

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
