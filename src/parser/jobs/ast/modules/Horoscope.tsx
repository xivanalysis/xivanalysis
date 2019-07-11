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
		1: SEVERITY.MAJOR,
	},
	NO_HOROSCOPE_HELIOS: {
		1: SEVERITY.MAJOR,
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
	static handle = 'earthlystar'
	static title = t('ast.horoscope.title')`Horoscope`

	@dependency private suggestions!: Suggestions

	_active = false
	_uses = 0
	_missedActivations = 0
	_horoscope: HoroscopeWindow = {
		start: 0,
		end: null,
		casts: [],
	}
	_history: HoroscopeWindow[] = []

	protected init() {
		this.addHook('cast', {abilityId: ACTIONS.HOROSCOPE.id, by: 'player'}, this._onHoroscope)
		const horoscopeBuffFilter = {
			by: 'player',
			abilityId: [],
		}
		this.addHook('applybuff', {abilityId: HOROSCOPE_STATUSES, by: 'player', to: 'player'}, this._onApplyBuff)
		this.addHook('removebuff', {abilityId: HOROSCOPE_STATUSES, by: 'player', to: 'player'}, this._onRemoveBuff)
		this.addHook('cast', {abilityId: ACTIONS.HOROSCOPE_ACTIVATION.id, by: 'player'}, this._onActivate)
		this.addHook('cast', {abilityId: HELIOS_CASTS, by: 'player'}, this._onHelios)

		this.addHook('complete', this._onComplete)
	}

	_onHoroscope(event: CastEvent) {
		this._uses++
		// If it's a LIGHTSPEED cast, start tracking
		this._startHoroscope(event.timestamp)
	}

	_onApplyBuff(event: BuffEvent) {
		if (event.ability.guid === STATUSES.HOROSCOPE.id) {
			if (this._active) { return }
			this._startHoroscope(event.timestamp)
		}
	}
	_onRemoveBuff(event: BuffEvent) {
		if (event.ability.guid === STATUSES.HOROSCOPE_HELIOS.id && this._active) {
			// Dropped Horoscope without activating
			// if(this._horoscope.casts.length > 1
				// && ACTIONS.HOROSCOPE_ACTIVATION.id !== this._horoscope.casts[1].ability.guid) {
				this._missedActivations++
				this._stopAndSave(event.timestamp)
			// }
		}
		if (event.ability.guid === STATUSES.HOROSCOPE.id && this._active) {
			// Dropped Horoscope without activating
		if (this._horoscope.casts.length === 0) {
				this._missedActivations++
				this._stopAndSave(event.timestamp)
			}
		}
	}
	_onHelios(event: CastEvent) {
		if (!this._active) {
			return
		}
		this._horoscope.casts.push(event)
	}
	_onActivate(event: CastEvent) {
		this._horoscope.casts.push(event)
		this._stopAndSave(event.timestamp)
	}

	_startHoroscope(start: number) {
		this._active = true
		this._horoscope = {
			start,
			end: null,
			casts: [],
		}
	}

	_stopAndSave(endTime = this.parser.currentTimestamp) {
		// Make sure we've not already stopped this one
		if (!this._active) {
			return
		}
		this._active = false
		this._horoscope.end = endTime

		this._history.push(this._horoscope)
	}

	_onComplete() {
		// Clean up any existing casts
		if (this._active) {
			this._stopAndSave()
		}

		/*
			SUGGESTION: Didn't activate
		*/
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HOROSCOPE_ACTIVATION.icon,
			content: <Trans id="ast.horoscope.suggestion.expired.content">
				<ActionLink {...ACTIONS.HOROSCOPE} /> does not activate by itself, so don't forget to use it again or it will expire for no potency.
			</Trans>,
			why: <Trans id="ast.horoscope.suggestion.expired.why">
				<Plural value={this._missedActivations} one="# expiration" other="# expirations" />  of Horoscope without reading fortunes again.
			</Trans>,
			tiers: SEVERETIES.ACTIVATES_MISSED,
			value: this._missedActivations,
		}))

		/*
			SUGGESTION: Helios without Horoscope
		*/
		// this.suggestions.add(new TieredSuggestion({
		// 	icon: ACTIONS.HOROSCOPE.icon,
		// 	content: <Trans id="ast.horoscope.suggestion.no-horoscope-helios.content">
		// 		Use <ActionLink {...ACTIONS.HOROSCOPE} /> more frequently. It may save a healing GCD and results in more damage output.
		// 	</Trans>,
		// 	tiers: SEVERETIES.USES_MISSED,
		// 	value: 1,
		// 	why: <Trans id="ast.horoscope.suggestion.no-horoscope-helios.why">
		// 		{1} Helios or Aspected Helios was cast without Horoscope despite {this.parser.formatDuration(holdDuration)}.
		// 	</Trans>,
		// }))
	}

}
