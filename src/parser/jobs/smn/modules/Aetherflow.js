import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// Severities
const MULTI_HIT_SKILL_DATA = {
	[ACTIONS.PAINFLARE.id]: {
		minTargets: 2,
		severity: {
			1: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	},
	[ACTIONS.ENERGY_SIPHON.id]: {
		minTargets: 3,
		severity: {
			1: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	},
}

export default class Aetherflow extends Module {
	static handle = 'aetherflow'
	static title = t('smn.aetherflow.title')`Aetherflow`
	static dependencies = [
		// Ensure AoE runs cleanup before us
		'aoe', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'suggestions',
	]
	static displayOrder = DISPLAY_ORDER.AETHERFLOW

	_badMultiHitCasts = {}
	constructor(...args) {
		super(...args)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: Object.keys(MULTI_HIT_SKILL_DATA).map(Number),
		}, this._onAoeDamage)
		this.addHook('complete', this._onComplete)
	}

	_onAoeDamage(event) {
		const abilityId = event.ability.guid
		if (event.hits.length < MULTI_HIT_SKILL_DATA[abilityId].minTargets) {
			if (!this._badMultiHitCasts[abilityId]) {
				this._badMultiHitCasts[abilityId] = 0
			}
			this._badMultiHitCasts[abilityId]++
		}
	}

	_onComplete() {
		// Painflare suggestion, I want to say < 4 is medium because 4 is greater than a Deathflare
		const numBadPainflares = this._badMultiHitCasts[ACTIONS.PAINFLARE.id] || 0
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.PAINFLARE.icon,
			content: <Trans id="smn.aetherflow.suggestions.painflare.content">
				Avoid casting <ActionLink {...ACTIONS.PAINFLARE}/> on a single target, as it deals less damage than <ActionLink {...ACTIONS.FESTER}/> per hit.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.painflare.why">
				{numBadPainflares} single-target
				<Plural value={numBadPainflares} one="cast" other="casts"/>
				of Painflare.
			</Trans>,
			tiers: MULTI_HIT_SKILL_DATA[ACTIONS.PAINFLARE.id].severity,
			value: numBadPainflares,
		}))

		// Energy Siphon suggestion, I want to say < 3 is medium because 3 on two targets is greater than a full Energy Drain (or 2 casts on 1 target)
		const numBadEnergySiphons = this._badMultiHitCasts[ACTIONS.ENERGY_SIPHON.id] || 0
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.ENERGY_SIPHON.icon,
			content: <Trans id="smn.aetherflow.suggestions.energysiphon.content">
				Avoid casting <ActionLink {...ACTIONS.ENERGY_SIPHON}/> on fewer than three targets, as it deals less damage than <ActionLink {...ACTIONS.ENERGY_DRAIN}/> per hit.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.energysiphon.why">
				{numBadEnergySiphons} <Plural value={numBadEnergySiphons} one="cast" other="casts"/>
				of Energy Siphon hit fewer than 3 targets.
			</Trans>,
			tiers: MULTI_HIT_SKILL_DATA[ACTIONS.ENERGY_SIPHON.id].severity,
			value: numBadEnergySiphons,
		}))
	}

	// Suggestion section for Bane for later. Tricky to deal with, but there's bane seeds for spreads
	// However one good one to evaluate is single target banes (with the above included?)

}
