import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {getDataBy} from 'data/getDataBy'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {RotationTable} from 'components/ui/RotationTable'
import React from 'react'

export default class Devotion extends Module {
	static displayOrder = DISPLAY_ORDER.DEVOTION
	static handle = 'devotion'
	static title = t('smn.devotion.title')`Devotion Actions`
	static dependencies = [
		'combatants',
		'timeline',
	]

	_devotionWindows = []
	// {
	//	start: Number
	//	events: [Event]
	// }
	_currentWindow = null

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
		this.addEventHook('applybuff', {by: 'pet', to: 'player', abilityId: STATUSES.DEVOTION.id}, this._onDevotionApplied)
	}

	_onDevotionApplied(event) {
		this._currentWindow = {
			start: event.timestamp - this.parser.fight.start_time,
			events: [],
		}
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		// Disregard auto attacks
		if (!action || action.autoAttack) {
			return
		}
		if (this.combatants.selected.hasStatus(STATUSES.DEVOTION.id)) {
			this._pushToWindow(event)
		} else {
			this._closeWindow()
		}
	}

	_onComplete() {
		this._closeWindow()
	}

	_pushToWindow(event) {
		if (!this._currentWindow) {
			// If _currentWindow is not yet defined, assume Devotion was applied prepull
			this._currentWindow = {
				start: 0,
				events: [],
			}
		}
		this._currentWindow.events.push(event)
	}

	_closeWindow() {
		if (this._currentWindow) {
			this._devotionWindows.push(this._currentWindow)
			this._currentWindow = null
		}
	}

	output() {
		const rotationData = this._devotionWindows.map(devotionWindow => {
			if (!devotionWindow || !devotionWindow.events.length) {
				return {}
			}
			const events = devotionWindow.events
			const windowStart = devotionWindow.start
			const windowEnd = events[events.length - 1].timestamp - this.parser.fight.start_time

			return {
				start: windowStart,
				end: windowEnd,
				rotation: devotionWindow.events,
			}
		})
		return <RotationTable
			data={rotationData}
			onGoto={this.timeline.show}
			headerTitle={<Trans id="smn.devotion.table-header">Devotion Actions</Trans>}
		/>
	}
}
