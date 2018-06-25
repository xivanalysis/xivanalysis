import React, { Fragment } from 'react'
import { Accordion } from 'semantic-ui-react'

import Rotation from 'components/ui/Rotation'
import ACTIONS, { getAction } from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class Triple extends Module {
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions'
	]
	name = 'Triplecast Usage'

    _active = false
    _triple = {}
	_history = []

	_ctIndex = null

	on_removebuff_byPlayer(event) {
		if (event.ability.guid !== STATUSES.TRIPLECAST.id) {
			return
		}

		// Stop tracking and save to history
		this.stopAndSave()
	}

	on_cast_byPlayer(event) {
		const actionId = event.ability.guid

		// Start tracking
		if (actionId === ACTIONS.TRIPLECAST.id) {
			this._active = true
			this._triple = {
				start: event.timestamp,
				end: null,
				casts: []
			}

			this._ctIndex = this.castTime.set('all', 0)
		}

		// Only going to save casts during DWT
		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		// Save the event to the DWT casts
		this._triple.casts.push(event)
	}

	on_complete() {
		// Clean up any existing casts
		if (this._active) {
			this.stopAndSave()
		}
	}

	stopAndSave() {
		this._active = false
		this._triple.end = this.parser.currentTimestamp
		this._history.push(this._triple)

		this.castTime.reset(this._ctIndex)
	}

	activeAt(time) {
		// If it's during the current one, easy way out
		if (this._active && this._triple.start <= time) {
			return true
		}

		return this._history.some(triple => triple.start <= time && triple.end >= time)
	}

	output() {
		const panels = this._history.map(triple => {
			const numGcds = triple.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			return {
				title: {
					key: 'title-' + triple.start,
					content: <Fragment>
						{this.parser.formatTimestamp(triple.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
					</Fragment>
				},
				content: {
					key: 'content-' + triple.start,
					content: <Rotation events={triple.casts}/>
				}
			}
		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
