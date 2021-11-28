import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Tiny module to count the number of early detonations on Earthly Star.
// TODO: Could expand to analyse Earthly Star usage, timing, overheal, etc - Sushi

const SEVERETIES = {
	UNCOOKED: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	USES_MISSED: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

export default class EarthlyStar extends Analyser {
	static override handle = 'earthlystar'
	static override title = t('ast.earthly-star.title')`Earthly Star`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private prepull = false
	private uses = 0
	private lastUse = 0
	private totalHeld = 0
	private earlyBurstCount = 0

	private petCasts: Array<Action['id']> = [this.data.actions.STELLAR_BURST.id, this.data.actions.STELLAR_EXPLOSION.id]

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.EARTHLY_STAR.id), this.onPlace)
		this.addEventHook(filter<Event>()
			.source('pet')
			.type('action')
			.action(oneOf(this.petCasts)), this.onPetCast)

		this.addEventHook('complete', this._onComplete)
	}

	private onPlace(event: Events['action']) {
		this.uses++

		// this was prepull
		if (event.timestamp < this.parser.pull.timestamp) {
			this.prepull = true
		}

		// TODO: Instead determine how far back they used it prepull by checking explosion time.
		if (this.lastUse === 0) {
			this.lastUse = this.parser.pull.timestamp
		}

		let drift = 0

		if (this.uses === 1 && !this.prepull) {
			// The first use, take holding as from the start of the fight
			drift = event.timestamp - this.parser.pull.timestamp
		} else {
			// Take holding as from the time it comes off cooldown
			drift = event.timestamp - this.lastUse - this.data.actions.EARTHLY_STAR.cooldown
		}

		// Keep track of total drift time not using star
		this.totalHeld += Math.max(0, drift)

		// update the last use
		this.lastUse = event.timestamp
	}

	private onPetCast(event: Events['action']) {
		const actionID = event.action

		if (actionID === this.data.actions.STELLAR_BURST.id) {
			this.earlyBurstCount++
		}
	}

	_onComplete() {

		/*
			SUGGESTION: Early detonations
		*/
		const earlyBurstCount = this.earlyBurstCount
		if (earlyBurstCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.STELLAR_DETONATION.icon,
				content: <Trans id="ast.earthly-star.suggestion.uncooked.content">
					Plan your <DataLink action="EARTHLY_STAR" /> placements so that it's always cooked enough for the full potency when you need it.
				</Trans>,
				why: <Trans id="ast.earthly-star.suggestion.uncooked.why">
					<Plural value={earlyBurstCount} one="# detonation" other="# detonations" /> of an uncooked Earthly Star.
				</Trans>,
				tiers: SEVERETIES.UNCOOKED,
				value: earlyBurstCount,
			}))
		}

		// If they stopped using Star at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.pull.duration + this.parser.pull.timestamp - this.lastUse > this.data.actions.EARTHLY_STAR.cooldown) {
			this.totalHeld += (this.parser.pull.duration + this.parser.pull.timestamp - (this.lastUse + this.data.actions.EARTHLY_STAR.cooldown))
		}

		/*
			SUGGESTION: Missed uses
		*/
		const holdDuration = this.uses === 0 ? this.parser.pull.duration : this.totalHeld
		const usesMissed = Math.floor(holdDuration / this.data.actions.EARTHLY_STAR.cooldown)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.EARTHLY_STAR.icon,
			content: <Trans id="ast.earthly-star.suggestion.missed-use.content">
				Use <DataLink action="EARTHLY_STAR" /> more frequently. It may save a healing GCD and results in more damage output.
			</Trans>,
			tiers: SEVERETIES.USES_MISSED,
			value: usesMissed,
			why: <Trans id="ast.earthly-star.suggestion.missed-use.why">
				About {usesMissed} uses of Earthly Star were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
			</Trans>,
		}))
	}

}
