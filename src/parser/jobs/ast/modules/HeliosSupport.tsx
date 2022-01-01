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

export class HeliosSupport extends Analyser {
	static override handle = 'horoscope'
	static override title = t('ast.horoscope.title')`Horoscope`

	@dependency private data!: Data
	@dependency private cooldowns!: Cooldowns
	@dependency private suggestions!: Suggestions

	private nonHoroscopeHeals: number = 0

	override initialise() {

		const HELIOS_CASTS = [
			this.data.actions.HELIOS.id,
			this.data.actions.ASPECTED_HELIOS.id,
		]

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(HELIOS_CASTS)), this.onHeliosCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onHeliosCast() {
		if (this.data.actions.HOROSCOPE.cooldown -  this.cooldowns.remaining('HOROSCOPE') < this.data.statuses.HOROSCOPE.duration //checks whether horoscope was just used
		|| this.data.actions.NEUTRAL_SECT.cooldown -  this.cooldowns.remaining('NEUTRAL_SECT') < this.data.statuses.NEUTRAL_SECT.duration //checks whether neutral sect was just used
		|| (this.cooldowns.remaining('NEUTRAL_SECT') > 0 && this.cooldowns.remaining('HOROSCOPE') > 0)) { //if neither were just used, check if they're on CD
			return
		}
		this.nonHoroscopeHeals++
	}

	private onComplete() {
		/*
			SUGGESTION: AOE heal without horoscope
		*/
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HELIOS.icon,
			content: <Trans id="ast.horoscope.suggestion.usage.content">
				Try to plan your <DataLink action="HOROSCOPE" /> or <DataLink action="NEUTRAL_SECT" /> usages to have either up before you need to cast <DataLink action="HELIOS" /> or <DataLink action="ASPECTED_HELIOS" />.
				<DataLink status="HOROSCOPE_HELIOS" showIcon={false} /> and <DataLink action="NEUTRAL_SECT" showIcon={false} /> may help to cover more damage later without needing to cast additional AOE heals.
			</Trans>,
			tiers: SEVERITIES.WASTED_AOE_HEAL_TIERS,
			value: this.nonHoroscopeHeals,
			why: <Trans id="ast.horoscope.suggestion.usage.why">
				<Plural value={this.nonHoroscopeHeals} one="# AOE GCD heal was cast" other="# AOE GCD heals were cast" /> without <DataLink action="HOROSCOPE" /> or <DataLink action="NEUTRAL_SECT" /> even though one of the two abilities were available.
			</Trans>,
		}))
	}
}
