import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
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
const PET_CASTS = [ACTIONS.STELLAR_BURST.id, ACTIONS.STELLAR_EXPLOSION.id]
// const PLAYER_STATUSES = [STATUSES.EARTHLY_DOMINANCE.id, STATUSES.GIANT_DOMINANCE.id]

export default class EarthlyStar extends Module {
	static handle = 'earthlystar'
	static title = t('ast.earthly-star.title')`Earthly Star`

	@dependency private suggestions!: Suggestions

	_uses = 0
	_lastUse = 0
	_totalHeld = 0
	_earlyBurstCount = 0

	protected init() {
		this.addHook('cast', {abilityId: ACTIONS.EARTHLY_STAR.id, by: 'player'}, this._onSet)
		this.addHook('cast', {abilityId: PET_CASTS, by: 'pet'}, this._onPetCast)
		// this.addHook('applybuff', {abilityId: PLAYER_STATUSES, by: 'player'}, this._onDominance)

		this.addHook('complete', this._onComplete)
	}

	_onSet(event: CastEvent) {
		this._uses++
		// TODO: Instead determine how far back they used it prepull by checking explosion time.
		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		const _held = event.timestamp - this._lastUse - (ACTIONS.EARTHLY_STAR.cooldown * 1000)
		if (_held > 0) {
			this._totalHeld += _held
		}
		// update the last use
		this._lastUse = event.timestamp
	}

	_onPetCast(event: CastEvent) {
		const actionID = event.ability.guid

		if (actionID === ACTIONS.STELLAR_BURST.id) {
			this._earlyBurstCount++
		}
	}

	_onComplete() {

		/*
			SUGGESTION: Early detonations
		*/
		const earlyBurstCount = this._earlyBurstCount
		if (earlyBurstCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.STELLAR_DETONATION.icon,
				content: <Trans id="ast.earthly-star.suggestion.uncooked.content">
					Plan your <ActionLink {...ACTIONS.EARTHLY_STAR} /> placements so that it's always cooked enough for the full potency when you need it.
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
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		const _usesMissed = Math.floor(holdDuration / (ACTIONS.EARTHLY_STAR.cooldown * 1000))
		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.EARTHLY_STAR.icon,
				content: <Trans id="ast.earthyl-star.suggestion.missed-use.content">
					Use <ActionLink {...ACTIONS.EARTHLY_STAR} /> more frequently. It may save a healing GCD and results in more damage output.
				</Trans>,
				tiers: SEVERETIES.USES_MISSED,
				value: this._uses === 0 ? 100 : _usesMissed,
				why: <Trans id="ast.earthyl-star.suggestion.missed-use.why">
					About {_usesMissed} uses of Earthly Star were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Trans>,
			}))
		}
	}

}
