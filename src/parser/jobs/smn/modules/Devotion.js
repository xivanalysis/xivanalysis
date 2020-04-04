import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {getDataBy} from 'data/getDataBy'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {RotationTable} from 'components/ui/RotationTable'
import React from 'react'

const PLAYERS_HIT_TARGET = 8

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
	//	playersHit: [Number]
	//	events: [Event]
	// }
	_currentWindow = null

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._closeWindow)
		this.addEventHook('applybuff', {by: 'pet', to: 'player', abilityId: STATUSES.DEVOTION.id}, this._onDevotionApplied)
		this.addEventHook('removebuff', {by: 'pet', to: 'player', abilityId: STATUSES.DEVOTION.id}, this._closeWindow)
		this.addEventHook('normalisedapplybuff', {by: 'pet', abilityId: STATUSES.DEVOTION.id}, this._countDevotionTargets)
	}

	_countDevotionTargets(event) {
		this._openWindow(event.timestamp)

		const playersHit = event.confirmedEvents.map(hit => hit.targetID).filter(id => this.parser.fightFriendlies.findIndex(f => f.id === id) >= 0)
		playersHit.forEach(id => {
			if (!this._currentWindow.playersHit.includes(id)) {
				this._currentWindow.playersHit.push(id)
			}
		})
	}

	_onDevotionApplied(event) {
		this._openWindow(event.timestamp)
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		// Disregard auto attacks
		if (!action || action.autoAttack) {
			return
		}
		if (this._currentWindow && this.combatants.selected.hasStatus(STATUSES.DEVOTION.id)) {
			this._pushToWindow(event)
		}
	}

	_pushToWindow(event) {
		if (this._currentWindow) {
			this._currentWindow.events.push(event)
		}
	}

	_openWindow(timestamp) {
		if (this._currentWindow) {
			return this._currentWindow
		}
		this._currentWindow = {
			start: timestamp - this.parser.fight.start_time,
			events: [],
			playersHit: [],
		}
		return this._currentWindow
	}

	_closeWindow() {
		if (this._currentWindow) {
			this._devotionWindows.push(this._currentWindow)
			this._currentWindow = null
		}
	}

	output() {
		const rotationData = this._devotionWindows.map(devotionWindow => {
			if (!devotionWindow) {
				return null
			}

			const targetsData = {}
			targetsData.players = {
				actual: devotionWindow.playersHit.length,
				expected: PLAYERS_HIT_TARGET,
			}
			const events = devotionWindow.events
			const windowStart = devotionWindow.start

			const windowEnd = devotionWindow.events.length ?
				events[events.length - 1].timestamp - this.parser.fight.start_time :
				this.parser.fight.end_time

			return {
				start: windowStart,
				end: windowEnd,
				rotation: devotionWindow.events,
				targetsData,
			}
		}).filter(window => window !== null)
		const rotationTargets = [{
			header: <Trans id="smn.devotion.players-count">Players Buffed</Trans>,
			accessor: 'players',
		}]
		return <RotationTable
			targets={rotationTargets}
			data={rotationData}
			onGoto={this.timeline.show}
			headerTitle={<Trans id="smn.devotion.table-header">Devotion Actions</Trans>}
		/>
	}
}
