import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Data} from 'parser/core/modules/Data'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
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

// const PLAYER_CASTS = [ACTIONS.EARTHLY_STAR.id, ACTIONS.STELLAR_DETONATION.id]
// const PLAYER_STATUSES = [STATUSES.EARTHLY_DOMINANCE.id, STATUSES.GIANT_DOMINANCE.id]

export default class EarthlyStar extends Module {
	static handle = 'earthlystar'
	static title = t('ast.earthly-star.title')`Earthly Star`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private uses = 0
	private lastUse = 0
	private totalHeld = 0
	private earlyBurstCount = 0

	private PET_CASTS: number[] = [this.data.actions.STELLAR_BURST.id, this.data.actions.STELLAR_EXPLOSION.id]


	protected init() {
		this.addEventHook('cast', {abilityId: this.data.actions.EARTHLY_STAR.id, by: 'player'}, this.onPlace)
		this.addEventHook('cast', {abilityId: this.PET_CASTS, by: 'pet'}, this.onPetCast)
		// this.addHook('applybuff', {abilityId: PLAYER_STATUSES, by: 'player'}, this._onDominance)

		this.addEventHook('complete', this._onComplete)
	}

	private onPlace(event: CastEvent) {
		this.uses++
		// TODO: Instead determine how far back they used it prepull by checking explosion time.
		if (this.lastUse === 0) { this.lastUse = this.parser.fight.start_time }

		const held = event.timestamp - this.lastUse - (this.data.actions.EARTHLY_STAR.cooldown * 1000)
		if (held > 0) {
			this.totalHeld += held
		}
		// update the last use
		this.lastUse = event.timestamp
	}

	private onPetCast(event: CastEvent) {
		const actionID = event.ability.guid

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
					Plan your <ActionLink {...this.data.actions.EARTHLY_STAR} /> placements so that it's always cooked enough for the full potency when you need it.
				</Trans>,
				why: <Trans id="ast.earthly-star.suggestion.uncooked.why">
					<Plural value={earlyBurstCount} one="# detonation" other="# detonations" /> of an uncooked Earthly Star.
				</Trans>,
				tiers: SEVERETIES.UNCOOKED,
				value: earlyBurstCount,
			}))
		}

		/*
			SUGGESTION: Missed uses
		*/
		const holdDuration = this.uses === 0 ? this.parser.fightDuration : this.totalHeld
		const usesMissed = Math.floor(holdDuration / (this.data.actions.EARTHLY_STAR.cooldown * 1000))
		if (usesMissed > 1) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.EARTHLY_STAR.icon,
				content: <Trans id="ast.earthly-star.suggestion.missed-use.content">
					Use <ActionLink {...this.data.actions.EARTHLY_STAR} /> more frequently. It may save a healing GCD and results in more damage output.
				</Trans>,
				tiers: SEVERETIES.USES_MISSED,
				value: usesMissed,
				why: <Trans id="ast.earthly-star.suggestion.missed-use.why">
					About {usesMissed} uses of Earthly Star were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Trans>,
			}))
		}
	}

}
