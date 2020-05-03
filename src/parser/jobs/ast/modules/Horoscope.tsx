import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Things to track:
// Did they forget to activate horoscope?
// Did they cast a Helios/Aspected Helios without Horoscope despite having it up?
// Maybe track how they used it?

const SEVERETIES = {
	ACTIVATES_MISSED: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
	},
}

const HELIOS_CASTS = [
	ACTIONS.HELIOS.id,
	ACTIONS.ASPECTED_HELIOS.id,
]

const HOROSCOPE_STATUSES = [
	STATUSES.HOROSCOPE.id,
	STATUSES.HOROSCOPE_HELIOS.id,
]

interface HoroscopeWindow {
	start: number,
	end: number | null,
	casts: CastEvent[],
}

export default class Horoscope extends Module {
	static handle = 'horoscope'
	static title = t('ast.horoscope.title')`Horoscope`

	@dependency private suggestions!: Suggestions

	private uses = 0
	private activations = 0

	protected init() {
		this.addEventHook('cast', {abilityId: ACTIONS.HOROSCOPE.id, by: 'player'}, this.onHoroscope)
		this.addEventHook('cast', {abilityId: ACTIONS.HOROSCOPE_ACTIVATION.id, by: 'player'}, this.onActivate)
		this.addEventHook('complete', this.onComplete)
	}

	private onHoroscope(event: CastEvent) {
		this.uses++
	}
	private onActivate(event: CastEvent) {
		this.activations++
	}

	onComplete() {
		/*
			SUGGESTION: Didn't activate
		*/
		const missedActivations = this.uses - this.activations
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HOROSCOPE_ACTIVATION.icon,
			content: <Trans id="ast.horoscope.suggestion.expired.content">
				<ActionLink {...ACTIONS.HOROSCOPE} /> does not activate by itself, so don't forget to use it again or it will expire for no potency.
			</Trans>,
			why: <Trans id="ast.horoscope.suggestion.expired.why">
				<Plural value={missedActivations} one="# expiration" other="# expirations" />  of Horoscope without reading fortunes again.
			</Trans>,
			tiers: SEVERETIES.ACTIVATES_MISSED,
			value: missedActivations,
		}))

	}

}
