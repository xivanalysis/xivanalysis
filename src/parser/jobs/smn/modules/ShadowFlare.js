import {Trans, Plural, i18nMark} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PATCHES from 'data/PATCHES'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestLower} from 'utilities'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// In a single target scenario, SF should always tick 5 times + 1 time on the cast (4.4 patch)
const MIN_HITS = {
	[PATCHES['4.0'].date]: 5,
	[PATCHES['4.4'].date]: 6,
}

// Ticks every 3s
const TICK_SPEED = 3000

export default class ShadowFlare extends Module {
	static handle = 'shadowFlare'
	static i18n_id = i18nMark('smn.shadow-flare.title')
	static title = 'Shadow Flare'
	static dependencies = [
		'suggestions',
	]
	static displayOrder = DISPLAY_ORDER.SHADOW_FLARE

	_casts = []

	constructor(...args) {
		super(...args)
		// Using applybuff instead of cast in case it was precast - the buff will have a fab'd event for us to use
		this.addHook('applybuff', {abilityId: STATUSES.SHADOW_FLARE.id}, this._onCast)
		this.addHook('aoedamage', {abilityId: STATUSES.SHADOW_FLARE.id}, this._onDamage)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		this._casts.push({
			cast: event,
			hits: [],
		})
	}

	_onDamage(event) {
		// If there's no casts at all, use the damage event to fab one
		if (!this._casts.length) {
			this._onCast(event)
		}
		this._casts[this._casts.length - 1].hits.push(event)
	}

	_onComplete() {
		// Work out the appropriate number of hits based on patch
		const minHits = matchClosestLower(MIN_HITS, this.parser.parseDate)

		const missedTicks = this._casts.reduce((carry, cast) => {
			const hits = cast.hits.reduce((carry, value) => carry + value.hits.length, 0)

			// Not going to fault for missing ticks after the boss died
			const possibleTicks = Math.min(minHits, Math.floor((this.parser.fight.end_time - cast.cast.timestamp) / TICK_SPEED))

			return carry + (possibleTicks - Math.min(possibleTicks, hits))
		}, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SHADOW_FLARE.icon,
			tiers: {
				1: SEVERITY.MINOR,
				[minHits]: SEVERITY.MEDIUM,
				[minHits * 2]: SEVERITY.MAJOR,
			},
			value: missedTicks,
			content: <Trans id="smn.shadow-flare.suggestions.missed-ticks.content">
				Ensure you place <ActionLink {...ACTIONS.SHADOW_FLARE} /> such that it can deal damage for its entire duration, or can hit multiple targets per tick.
			</Trans>,
			why: <Trans id="smn.shadow-flare.suggestions.missed-ticks.why">
				<Plural value={missedTicks} one="# missed tick" other="# missed ticks"/>
				of Shadow Flare.
			</Trans>,
		}))
	}

	output() {
		if (!this._casts.length) {
			return null
		}

		return <ul>
			{this._casts.map(cast => <li key={cast.cast.timestamp}>
				<strong>{this.parser.formatTimestamp(cast.cast.timestamp)}</strong>:&nbsp;
				<Plural id="smn.shadow-flare.ticks" value={cast.hits.length} one="# tick" other="# ticks"/>,&nbsp;
				<Plural id="smn.shadow-flare.hits" value={cast.hits.reduce((carry, value) => carry + value.hits.length, 0)} one="# hit" other="# hits"/>
			</li>)}
		</ul>
	}
}
