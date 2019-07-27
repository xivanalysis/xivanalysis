import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// Severities
const PAINFLARE_SEVERITY = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

const ENERGY_SIPHON_SEVERITY = {
	1: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export default class Aetherflow extends Module {
	static handle = 'aetherflow'
	static title = t('smn.aetherflow.title')`Aetherflow`
	static dependencies = [
		// Ensure AoE runs cleanup before us
		'aoe', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'gauge',
		'suggestions',
	]
	static displayOrder = DISPLAY_ORDER.AETHERFLOW

	// _badBanes = []         // In case we ever want to check for Banes where 1 or 0 DoTs are spread
	// _reallyBadBanes = []   // DoTless Bane...
	// _badFesters = []       // 1 DoT Fester. Oh no, it gets worse!
	// _reallyBadFesters = [] // 0 DoT Fester. :r333333:
	_badPainflares = []
	_badEnergySiphons = []

	constructor(...args) {
		super(...args)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: [ACTIONS.PAINFLARE.id, ACTIONS.ENERGY_SIPHON.id],
		}, this._onAoeDamage)
		this.addHook('complete', this._onComplete)
	}

	_onAoeDamage(event) {
		if (event.ability.guid === ACTIONS.PAINFLARE.id) {
			// Only fault single target PFs _outside_ rushes.
			if (event.hits.length <= 1 && !this.gauge.isRushing) {
				this._badPainflares.push(event)
			}
		} else if (event.ability.guid === ACTIONS.ENERGY_SIPHON.id) {
			if (event.hits.length <= 2) {
				this._badEnergySiphons.push(event)
			}
		}
	}

	_onComplete() {
		// Painflare suggestion, I want to say < 4 is medium because 4 is greater than a Deathflare
		const numBadPainflares = this._badPainflares.length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.PAINFLARE.icon,
			content: <Trans id="smn.aetherflow.suggestions.painflare.content">
				Avoid casting <ActionLink {...ACTIONS.PAINFLARE}/> on a single target unless rushing a <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>, as it deals less damage than <ActionLink {...ACTIONS.FESTER}/> per hit.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.painflare.why">
				{numBadPainflares} single-target
				<Plural value={numBadPainflares} one="cast" other="casts"/>
				of Painflare.
			</Trans>,
			tiers: PAINFLARE_SEVERITY,
			value: numBadPainflares,
		}))

		// Energy Siphon suggestion, I want to say < 3 is medium because 3 on two targets is greater than a full Energy Drain (or 2 casts on 1 target)
		const numBadEnergySiphons = this._badEnergySiphons.length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.ENERGY_SIPHON.icon,
			content: <Trans id="smn.aetherflow.suggestions.energysiphon.content">
				Avoid casting <ActionLink {...ACTIONS.ENERGY_SIPHON}/> on less than three targets, as it deals less damage than <ActionLink {...ACTIONS.ENERGY_DRAIN}/> per hit.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.energysiphon.why">
				{numBadEnergySiphons} single- or two-target
				<Plural value={numBadEnergySiphons} one="cast" other="casts"/>
				of Painflare.
			</Trans>,
			tiers: ENERGY_SIPHON_SEVERITY,
			value: numBadEnergySiphons,
		}))
	}

	// Suggestion section for Bane for later. Tricky to deal with, but there's bane seeds for spreads
	// However one good one to evaluate is single target banes (with the above included?)

}
