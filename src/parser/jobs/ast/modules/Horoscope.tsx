import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Data} from 'parser/core/modules/Data'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Cooldowns from 'parser/core/modules/Cooldowns'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Things to track:
// Did they cast a Helios/Aspected Helios without Horoscope despite having it up?
// Maybe track how they used it?

const SEVERITIES = {
	ACTIVATES_MISSED: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
	},
	WASTED_AOE_HEAL_TIERS: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
	},
}

interface HoroscopeWindow {
	start: number,
	end: number | null,
	casts: CastEvent[],
}

export default class Horoscope extends Module {
	static handle = 'horoscope'
	static title = t('ast.horoscope.title')`Horoscope`

	@dependency private data!: Data
	@dependency private cooldowns!: Cooldowns
	@dependency private suggestions!: Suggestions

	private uses = 0
	private activations = 0
	private nonHoroscopeHeals = 0

	protected init() {

		const HELIOS_CASTS = [
			this.data.actions.HELIOS.id,
			this.data.actions.ASPECTED_HELIOS.id,
		]

		this.addEventHook('cast', {abilityId: HELIOS_CASTS, by: 'player'}, this.onHeliosCast)
		this.addEventHook('cast', {abilityId: this.data.actions.HOROSCOPE.id, by: 'player'}, this.onHoroscope)
		this.addEventHook('cast', {abilityId: this.data.actions.HOROSCOPE_ACTIVATION.id, by: 'player'}, this.onActivate)
		this.addEventHook('complete', this.onComplete)
	}

	private onHoroscope(event: CastEvent) {
		this.uses++
	}
	private onActivate(event: CastEvent) {
		this.activations++
	}

	private onHeliosCast(event: CastEvent) {
		if (this.cooldowns.getCooldownRemaining(this.data.actions.HOROSCOPE.id) > 0) {
			return
		}
		this.nonHoroscopeHeals++
	}

	onComplete() {

		if (this.parser.patch.before('5.3')){
			/*
				SUGGESTION: Didn't activate
			*/
			const missedActivations = this.uses - this.activations
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.HOROSCOPE_ACTIVATION.icon,
				content: <Trans id="ast.horoscope.suggestion.expired.content">
					<ActionLink {...this.data.actions.HOROSCOPE} /> does not activate by itself, so don't forget to use it again or it will expire for no potency.
			</Trans>,
				why: <Trans id="ast.horoscope.suggestion.expired.why">
					<Plural value={missedActivations} one="# expiration" other="# expirations" />  of Horoscope without reading fortunes again.
			</Trans>,
				tiers: SEVERITIES.ACTIVATES_MISSED,
				value: missedActivations,
			}))

		} else {
			/*
				SUGGESTION: AOE heal without horoscope
			*/
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.HOROSCOPE.icon,
				content: <Trans id="ast.horoscope.suggestion.usage.content">
					Plan to have <ActionLink {...this.data.actions.HOROSCOPE} /> up before you need to cast <ActionLink {...this.data.actions.HELIOS} /> or <ActionLink {...this.data.actions.ASPECTED_HELIOS} /> .
				<StatusLink {...this.data.statuses.HOROSCOPE_HELIOS} /> may help to cover more damage later without needing to cast more AOE heals.
			</Trans>,
				tiers: SEVERITIES.WASTED_AOE_HEAL_TIERS,
				value: this.nonHoroscopeHeals,
				why: <Trans id="ast.synastry.suggestion.why">
					<Plural value={this.nonHoroscopeHeals} one="# single-target GCD heal was cast" other="# single-target GCD heals were cast" /> without synastry even though it was available.
			</Trans>,
			}))
		}
	}
}
