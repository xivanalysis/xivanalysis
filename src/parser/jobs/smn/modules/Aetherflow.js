import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// Statuses that need to be up for Fester & Bane to actually do something good
const SMN_DOT_STATUSES = [
	STATUSES.BIO_III.id,
	STATUSES.MIASMA_III.id,
]

const FESTER_POT_PER_DOT = 150

// Severities
// In potency
const FESTER_SEVERITY = {
	1: SEVERITY.MEDIUM,
	600: SEVERITY.MAJOR,
}

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
		'enemies',
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

	_badDotReqCasts = {}

	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.FESTER.id, ACTIONS.BANE.id],
		}, this._onDotReqCast)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: [ACTIONS.PAINFLARE.id, ACTIONS.ENERGY_SIPHON.id],
		}, this._onAoeDamage)
		this.addHook('complete', this._onComplete)
	}

	_onDotReqCast(event) {
		const actionId = event.ability.guid

		const target = this.enemies.getEntity(event.targetID)
		if (!target) { return }
		const statusesMissing = SMN_DOT_STATUSES.length - SMN_DOT_STATUSES.filter(statusId => target.hasStatus(statusId)).length

		// Don't need to worry if they got them all up
		if (statusesMissing === 0) { return }

		// Make sure we're tracking this skill/num
		if (!this._badDotReqCasts[actionId]) {
			this._badDotReqCasts[actionId] = {}
		}
		if (!this._badDotReqCasts[actionId][statusesMissing]) {
			this._badDotReqCasts[actionId][statusesMissing] = 0
		}

		// Add to the appropriate key
		// Just tracking flat count for now. Expand to events if need info (for the timeline, yes pls)
		this._badDotReqCasts[actionId][statusesMissing]++
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
		// Suggestion for fester
		const badFesters = this._badDotReqCasts[ACTIONS.FESTER.id] || {}
		const festerKeys = Object.keys(badFesters).map(num => parseInt(num, 10))
		// Feel this can be used as a better base metric for judging Fester whiff severity, imo < 600 is medium, > major
		const totalFesterPotencyLost = festerKeys.reduce((carry, num) => carry + num * FESTER_POT_PER_DOT * badFesters[num], 0)

		// Sorry Nem, I've simplified this a lot to smooth out the i18n process. We can have a look into improving the output later.
		const numBadFesters = festerKeys.reduce((carry, num) => carry + badFesters[num], 0)

		// Fester suggestion
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FESTER.icon,
			content: <Trans id="smn.aetherflow.suggestions.fester.content">
				To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
			</Trans>,
			why: <Trans id="smn.aetherflow.suggestions.fester.why">
				{totalFesterPotencyLost} potency lost to
				<Plural value={numBadFesters} one="# cast" other="# casts"/>
				of Fester on targets missing DoTs.
			</Trans>,
			tiers: FESTER_SEVERITY,
			value: totalFesterPotencyLost,
		}))

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
