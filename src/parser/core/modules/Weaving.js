import React from 'react'

import { getAction } from 'data/ACTIONS'
import Module from 'parser/core/Module'

// TODO: This doesn't account for Ninjutsu, or BRD weaves. Work it out later.
const MAX_WEAVES = 2

export default class Weaving extends Module {
	static displayOrder = -100

	weaves = 0
	gcdEvent = null
	history = []

	on_cast_byPlayer(event) {
		const action = getAction(event.ability.guid)

		// If it's not a GCD, just bump the weave count
		if (!action.onGcd) {
			this.weaves++
			return
		}

		// If there's no gcd event, they're weaving on first GCD.
		// TODO: Do I care?
		if (this.gcdEvent === null && this.weaves > 0) {
			console.warn(this.weaves, 'weaves before first GCD. Check.')
		}

		// Throw the current state onto the history
		this.history.push({
			gcdEvent: this.gcdEvent || {},
			weaves: this.weaves
		})

		// Reset
		this.gcdEvent = event
		this.weaves = 0
	}

	output() {
		const badWeaves = this.history.filter(item => item.weaves > MAX_WEAVES)
		return <ul>
			{badWeaves.map(item => <li key={item.gcdEvent.timestamp}>
				TS: {this.parser.formatTimestamp(item.gcdEvent.timestamp)}<br/>
				Weaves: {item.weaves}
			</li>)}
		</ul>
	}
}
