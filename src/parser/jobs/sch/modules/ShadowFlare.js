import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// In a single target scenario, SF should always tick 5 times + 1 time on the cast (4.4 patch)
const MIN_HITS = {
	'4.0': 5,
	'4.4': 6,
}

// Ticks every 3s
const TICK_SPEED = 3000

// TODO: Consolidate this between SMN and SCH
export default class ShadowFlare extends Module {
	static displayOrder = DISPLAY_ORDER.SHADOW_FLARE
	static handle = 'shadowFlare'
	static title = t('sch.shadow-flare.title')`Shadow Flare`
	static dependencies = [
		'suggestions',
	]

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
		this._casts[this._casts.length - 1].hits.push(event)
	}

	_onComplete() {
		// Work out the appropriate number of hits based on patch
		const minHits = this.parser.patch.match(MIN_HITS)

		const missedTicks = this._casts.reduce((carry, cast) => {
			const hits = cast.hits.reduce((carry, value) => carry + value.hits.length, 0)

			// Not going to fault for missing ticks after the boss died
			const possibleTicks = Math.min(minHits, Math.floor((this.parser.fight.end_time - cast.cast.timestamp) / TICK_SPEED))

			return carry + (possibleTicks - Math.min(possibleTicks, hits))
		}, 0)

		if (missedTicks) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SHADOW_FLARE.icon,
				tiers: {
					1: SEVERITY.MINOR,
					[minHits]: SEVERITY.MEDIUM,
					[minHits * 2]: SEVERITY.MAJOR,
				},
				value: missedTicks,
				content: <Trans id="sch.shadow-flare.suggestions.missed-ticks.content">
				Ensure you place <ActionLink {...ACTIONS.SHADOW_FLARE} /> such that it can deal damage for its entire duration, or can hit multiple targets per tick.
				</Trans>,
				why: <Trans id="sch.shadow-flare.suggestions.missed-ticks.why">
					<Plural value={missedTicks} one="# missed tick" other="# missed ticks"/>
				of Shadow Flare.
				</Trans>,
			}))
		}
	}

	output() {
		return <ul>
			{this._casts.map(cast => <li key={cast.cast.timestamp}>
				<strong>{this.parser.formatTimestamp(cast.cast.timestamp)}</strong>:&nbsp;
				{cast.hits.length} ticks,&nbsp;
				{cast.hits.reduce((carry, value) => carry + value.hits.length, 0)} hits
			</li>)}
		</ul>
	}
}
