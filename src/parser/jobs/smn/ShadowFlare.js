import React from 'react'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class ShadowFlare extends Module {
	static handle = 'shadowFlare'
	static title = 'Shadow Flare'

	_casts = []

	constructor(...args) {
		super(...args)

		this.addHook('cast', {abilityId: ACTIONS.SHADOW_FLARE.id}, this._onCast)
		this.addHook('aoedamage', {abilityId: STATUSES.SHADOW_FLARE.id}, this._onDamage)
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
