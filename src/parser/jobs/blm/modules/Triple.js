import React, {Fragment} from 'react'
import {i18nMark} from '@lingui/react'
import {Accordion} from 'semantic-ui-react'

import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class Triple extends Module {
	static handle = 'triple'
	static i18n_id = i18nMark('blm.triple.title')
	static title = 'Triplecast Usage'
	static displayOrder = DISPLAY_ORDER.TRIPLE

	static dependencies = [
		'castTime',
	]

	_tripleFlag = false
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
		const gcdAction = getAction(actionId).onGcd
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

		//stop tracking
		if (this._tripleFlag) {
			//check if we are at the next GCD and finish up the list
			if (gcdAction) {
				if (this._active) {
					this._active = false
					this._tripleFlag = false
					this._triple.end = this.parser.currentTimestamp
					this._history.push(this._triple)
					this.castTime.reset(this._ctIndex)
				}
			} else {
				//OGCD? Better saving that
				this._triple.casts.push(event)
			}
		} else {
			// Save the event to the DWT-- ehhh Triple casts
			this._triple.casts.push(event)
		}
	}

	_onComplete() {
		// Clean up any existing casts
		if (this._active) {
			this._onRemoveTriple()
		}
	}

	_onRemoveTriple() {
		//flag to stop tracking
		this._tripleFlag = true
	}

	output() {
		const panels = this._history.map(triple => {
			const numGcds = triple.casts.filter(cast => !getAction(cast.ability.guid).onGcd).length - 1 // 1 is Triplecast itself
			return {
				key: 'title-' + triple.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(triple.start)}
						&nbsp;-&nbsp;{numGcds} oGCD(s)
					</Fragment>,
				},
				content: {
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
