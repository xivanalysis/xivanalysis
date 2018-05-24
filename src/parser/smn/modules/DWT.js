import React from 'react'

import { getAction } from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class DWT extends Module {
	static displayOrder = -100 // temp

	active = false
	dwt = {}
	history = []

	on_applybuff_byPlayer(event) {
		if (event.ability.guid !== STATUSES.DREADWYRM_TRANCE.id) {
			return
		}

		// Start tracking
		this.active = true
		this.dwt = {
			start: event.timestamp,
			end: null,
			casts: {}
		}
	}

	on_removebuff_byPlayer(event) {
		if (event.ability.guid !== STATUSES.DREADWYRM_TRANCE.id) {
			return
		}

		// Stop tracking and save to history
		this.stopAndSave()
	}

	on_cast_byPlayer(event) {
		// Only care about casts during DWT
		if (!this.active) {
			return
		}

		const actionId = event.ability.guid
		this.dwt.casts[actionId] = (this.dwt.casts[actionId] || 0) + 1
	}

	on_complete() {
		// Clean up any existing casts
		if (this.active) {
			this.stopAndSave()
		}
	}

	stopAndSave() {
		this.active = false
		this.dwt.end = this.parser.currentTimestamp
		this.history.push(this.dwt)
	}

	output() {
		return <ul>
			{this.history.map(dwt => <li key={dwt.start}>
				{this.parser.formatTimestamp(dwt.start)}
				<ul>
					{Object.keys(dwt.casts).map(actionId => <li key={actionId}>
						{getAction(actionId).name}: {dwt.casts[actionId]}
					</li>)}
				</ul>
			</li>)}
		</ul>
	}
}
