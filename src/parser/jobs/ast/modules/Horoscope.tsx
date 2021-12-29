import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Things to track:
// Did they cast a Helios/Aspected Helios without Horoscope despite having it up?
// Maybe track how they used it?

const SEVERITIES = {
	WASTED_AOE_HEAL_TIERS: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
	},
}

export class Horoscope extends Analyser {
	static override handle = 'horoscope'
	static override title = t('ast.horoscope.title')`Horoscope`

	@dependency private data!: Data
	@dependency private cooldowns!: Cooldowns
	@dependency private suggestions!: Suggestions

	private nonHoroscopeHeals = 0

	override initialise() {

		const HELIOS_CASTS = [
			this.data.actions.HELIOS.id,
			this.data.actions.ASPECTED_HELIOS.id,
		]
		const playerTypeFilter = filter<Event>().source(this.parser.actor.id).type('action')

		this.addEventHook(playerTypeFilter
			.action(oneOf(HELIOS_CASTS)), this.onHeliosCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onHeliosCast() {
		if (this.cooldowns.remaining('HOROSCOPE') > 0) {
			return
		}
		this.nonHoroscopeHeals++
	}

	onComplete() {
		/*
			SUGGESTION: AOE heal without horoscope
		*/
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HOROSCOPE.icon,
			content: <Trans id="ast.horoscope.suggestion.usage.content">
				Try to plan your <DataLink action="HOROSCOPE" /> usages to have it up before you need to cast <DataLink action="HELIOS" /> or <DataLink action="ASPECTED_HELIOS" />.
				<DataLink status="HOROSCOPE_HELIOS" /> may help to cover more damage later without needing to cast more AOE heals.
			</Trans>,
			tiers: SEVERITIES.WASTED_AOE_HEAL_TIERS,
			value: this.nonHoroscopeHeals,
			why: <Trans id="ast.horoscope.suggestion.usage.why">
				<Plural value={this.nonHoroscopeHeals} one="# AOE GCD heal was cast" other="# AOE GCD heals were cast" /> without horoscope even though it was available.
			</Trans>,
		}))
	}
}
