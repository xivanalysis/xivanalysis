import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class Triple extends Module {
	static handle = 'triple'
	static title = 'Triplecast Usage'
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions',
	]

	_active = false
	_triple = {}
	_history = []

	_ctIndex = null

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.TRIPLECAST.id,
		}, this._onRemoveTriple)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		// Start tracking
		if (actionId === ACTIONS.TRIPLECAST.id) {
			this._active = true
			this._triple = {
				start: event.timestamp,
				end: null,
				casts: [],
			}

			this._ctIndex = this.castTime.set('all', 0)
		}

		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		// Save the event to the DWT casts
		this._triple.casts.push(event)
	}

	_onComplete() {
		// Clean up any existing casts
		if (this._active) {
			this._onRemoveTriple()
		}
	}

	_onRemoveTriple() {
		if (this._active) {
			this._active = false
			this._triple.end = this.parser.currentTimestamp
			this._history.push(this._triple)

			this.castTime.reset(this._ctIndex)
		}
	}

	output() {
		const panels = this._history.map(triple => {
			const numGcds = triple.casts.filter(cast => !getAction(cast.ability.guid).onGcd).length - 1 // 1 is Triplecast itself
			return {
				title: {
					key: 'title-' + triple.start,
					content: <Fragment>
						{this.parser.formatTimestamp(triple.start)}
						&nbsp;-&nbsp;{numGcds} oGCD(s)
					</Fragment>,
				},
				content: {
					key: 'content-' + triple.start,
					content: <Rotation events={triple.casts}/>,
				},
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
