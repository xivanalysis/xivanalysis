import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PATCHES from 'data/PATCHES'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestLower} from 'utilities'

// In a single target scenario, SF should always tick 5 times + 1 time on the cast (4.4 patch)
const MIN_HITS = {
	[PATCHES['4.0'].date]: 5,
	[PATCHES['4.4'].date]: 6,
}

// Ticks every 3s
const TICK_SPEED = 3000

// TODO: Consolidate this between SMN and SCH
export default class ShadowFlare extends Module {
	static displayOrder = 52;
	static handle = 'shadowFlare'
	static title = 'Shadow Flare'
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
		const minHits = matchClosestLower(MIN_HITS, this.parser.parseDate)

		const missedTicks = this._casts.reduce((carry, cast) => {
			const hits = cast.hits.reduce((carry, value) => carry + value.hits.length, 0)

			// Not going to fault for missing ticks after the boss died
			const possibleTicks = Math.min(minHits, Math.floor((this.parser.fight.end_time - cast.cast.timestamp) / TICK_SPEED))

			return carry + (possibleTicks - Math.min(possibleTicks, hits))
		}, 0)

		if (missedTicks) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SHADOW_FLARE.icon,
				content: <Fragment>
					Ensure you place <ActionLink {...ACTIONS.SHADOW_FLARE} /> such that it can deal damage for its entire duration, or can hit multiple targets per tick.
				</Fragment>,
				why: missedTicks + ' missed ticks of Shadow Flare.',
				severity: missedTicks < minHits? SEVERITY.MINOR : missedTicks < minHits*2? SEVERITY.MEDIUM : SEVERITY.MAJOR,
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
