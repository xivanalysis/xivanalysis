import React, {Fragment} from 'react'
import _ from 'lodash'

import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {ARCANA_USE, EXPANDED_ARCANA_USE, DRAWN_ARCANA_USE, HELD_ARCANA_USE, ROYAL_ROAD_STATES, DRAWN_ARCANA, HELD_ARCANA} from './ArcanaGroups'
// import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'
// import {Accordion} from 'semantic-ui-react'

const MINOR_ARCANA_USE = [
	ACTIONS.LADY_OF_CROWNS.id,
	ACTIONS.LORD_OF_CROWNS.id,
]

const OGCD_ARCANA_REMOVAL = [
	ACTIONS.UNDRAW_SPREAD.id,
	ACTIONS.EMPTY_ROAD.id,
	ACTIONS.UNDRAW.id,
]

const CARD_ACTIONS = [
	ACTIONS.DRAW.id,
	ACTIONS.REDRAW.id,
	ACTIONS.SPREAD.id,
	ACTIONS.ROYAL_ROAD.id,
	ACTIONS.SLEEVE_DRAW.id,
	ACTIONS.MINOR_ARCANA.id,
	...MINOR_ARCANA_USE,
	...OGCD_ARCANA_REMOVAL,
	...ARCANA_USE,
	...EXPANDED_ARCANA_USE,
]

const ARCANA_STATUSES = [
	STATUSES.THE_BALANCE.id,
	STATUSES.THE_BOLE.id,
	STATUSES.THE_ARROW.id,
	STATUSES.THE_SPEAR.id,
	STATUSES.THE_EWER.id,
	STATUSES.THE_SPIRE.id,
]

export default class ArcanaTracking extends Module {
	static handle = 'arcanatracking'
	static title = 'Arcana Tracking'
	static dependencies = [
		// 'arcanum',
		// 'precastStatus',
		'suggestions',
	]

	constructor(...args) {
		super(...args)

		const cardActionFilter = {
			by: 'player',
			abilityId: CARD_ACTIONS,
		}

		// const cardStatusoffFilter = {
		// 	abilityID: ROYAL_ROAD_STATES,
		// }

		this.addHook('cast', cardActionFilter, this._onCast)
		this.addHook('applybuff', {by: 'player'}, this._onBuff)
		this.addHook('removebuff', {by: 'player'}, this._offRoyalRoad)
		this.addHook('complete', this._onComplete)

		this._minorArcanaHistory = []
		this._cardStateLog = []
		this._minorArcanasLost = 0

	}

	_onBuff(event) {
		if (![...ARCANA_STATUSES, ...ROYAL_ROAD_STATES, ...DRAWN_ARCANA, ...HELD_ARCANA].includes(event.ability.guid)) {
			return
		}

		if (ROYAL_ROAD_STATES.includes(event.ability.guid)) {
			// console.log(event)
			// TODO: WHY AM I DOING THIS WITH FIND()
			this._cardStateLog.find(stateItem => {
				if (stateItem.lastEvent && stateItem.lastEvent.timestamp === event.timestamp) {
					stateItem.rrAbility = event.ability
				}
			})
		}

		if (DRAWN_ARCANA.includes(event.ability.guid)) {
			// console.log(event)
			// TODO: WHY AM I DOING THIS WITH FIND()
			this._cardStateLog.find(stateItem => {
				if (stateItem.lastEvent && stateItem.lastEvent.timestamp === event.timestamp) {
					stateItem.drawState = event.ability
				}
			})
		}

		if (HELD_ARCANA.includes(event.ability.guid)) {
			// console.log(event)
			// TODO: WHY AM I DOING THIS WITH FIND()
			this._cardStateLog.find(stateItem => {
				if (stateItem.lastEvent && stateItem.lastEvent.timestamp === event.timestamp) {
					stateItem.spreadState = event.ability
				}
			})
		}

		// if (event.rrAbility && ARCANA_STATUSES.includes(event.ability.guid)) {
		// 	const castIndex = this._cardStateLog.findIndex(stateItem => stateItem.lastEvent && stateItem.lastEvent.timestamp === event.rrTimestamp)

		// 	if(!this._cardStateLog[castIndex - 1].rrAbility) {
		// 		console.log(event)
		// 		console.log(castIndex)

		// 		for(let i = 0; i < castIndex - 1; i++) {
		// 			this._cardStateLog[i].rrAbility = event.rrAbility
		// 		}
		// 	}
		// }

		// console.log(event)
		// const rrAbility = event.rrAbility || null

		// if (rrAbility) {
		// 	this._cardStateLog[this._cardStateLog.length - 2].rrAbility = rrAbility
		// }

	}

	// TODO: Off Royal road is broken??
	_offRoyalRoad(event) {
		if (!ROYAL_ROAD_STATES.includes(event.ability.guid)) {
			return
		}

		const isAfterCard = DRAWN_ARCANA_USE.includes(_.last(this._cardStateLog).lastEvent.ability.guid) || HELD_ARCANA_USE.includes(_.last(this._cardStateLog).lastEvent.ability.guid)

		if (!isAfterCard || _.last(this._cardStateLog).lastEvent.timestamp !== event.timestamp) {
			// console.log(event)
			const cardStateItem = {..._.last(this._cardStateLog)}

			cardStateItem.lastEvent = event
			cardStateItem.rrAbility = null

			this._cardStateLog.push(cardStateItem)
		}
	}

	_onCast(event) {

		// console.log(event)

		const actionId = event.ability.guid

		// Piecing together what they have on prepull
		if (this._cardStateLog.length === 0) {
			this._cardStateLog.push(this._initPullState(event))
		}

		const cardStateItem = {..._.last(this._cardStateLog)}

		cardStateItem.lastEvent = event

		// If they used any arcana, consider the rrAbility consumed
		if (DRAWN_ARCANA_USE.includes(actionId) || HELD_ARCANA_USE.includes(actionId)) {
			cardStateItem.lastEvent.rrAbility = cardStateItem.rrAbility
			cardStateItem.rrAbility = null
		}

		// If it was a drawn arcana, they had to have been holding onto this from the last instance of a DRAW/SLEEVE_DRAW/REDRAW
		// Loop backward and find it
		if (DRAWN_ARCANA_USE.includes(actionId)) {
			console.log(event)
			cardStateItem.drawState = null

			let lastDrawIndex = _.findLastIndex(this._cardStateLog,
				stateItem =>
					stateItem.lastEvent &&
				(stateItem.lastEvent.ability.guid === ACTIONS.DRAW.id
				|| stateItem.lastEvent.ability.guid === ACTIONS.SLEEVE_DRAW.id
				|| stateItem.lastEvent.ability.guid === ACTIONS.REDRAW.id)
			)

			// console.log(event)
			// console.log(lastDrawIndex)
			if (lastDrawIndex === -1) {
				// There were no draws. They had it prepull, so assume this is 0
				lastDrawIndex = 0
				// Modify log, they were holding onto this card since index

				_.forEachRight(this._cardStateLog,
					(stateItem, index) => {
						if (index >= lastDrawIndex) { stateItem.drawState = getAction(actionId) }
					})

			}
		}

		// If it was a drawn arcana, they had to have been holding onto this from the last instance of a SPREAD/SLEEVE_DRAW
		// Loop backward and find it
		if (HELD_ARCANA_USE.includes(actionId)) {
			console.log(event)
			cardStateItem.spreadState = null

			let lastSpreadIndex = _.findLastIndex(this._cardStateLog,
				stateItem =>
					stateItem.lastEvent &&
				(stateItem.lastEvent.ability.guid === ACTIONS.SPREAD.id
				|| stateItem.lastEvent.ability.guid === ACTIONS.SLEEVE_DRAW.id)
			)

			// console.log(event)
			// console.log(lastSpreadIndex)
			if (lastSpreadIndex === -1) {
				// There were no spreads. They had it prepull, so assume this is 0
				lastSpreadIndex = 0

				// Modify log, they were holding onto this card since index
				_.forEachRight(this._cardStateLog,
					(stateItem, index) => {
						if (index >= lastSpreadIndex) { stateItem.spreadState = getAction(actionId) }
					})

			}

		}

		if (actionId === ACTIONS.ROYAL_ROAD.id) {
			console.log(event)
			cardStateItem.drawState = null
		}

		// MINOR ARCANA STUFF
		if (actionId === ACTIONS.MINOR_ARCANA.id) {
			cardStateItem.drawState = null
			this._onMinorArcana(event)
		}

		if (actionId === ACTIONS.SLEEVE_DRAW.id) {
			console.log(event)
			this._onSleeveDraw(event)
		}

		if (actionId === ACTIONS.EMPTY_ROAD.id) {
			//
		}

		if (MINOR_ARCANA_USE.includes(actionId)) {
			cardStateItem.minorState = null

			let lastMinorIndex = _.findLastIndex(this._cardStateLog,
				stateItem =>
					stateItem.lastEvent &&
				(stateItem.lastEvent.ability.guid === ACTIONS.SLEEVE_DRAW.id
				|| stateItem.lastEvent.ability.guid === ACTIONS.MINOR_ARCANA.id)
			)

			// console.log(event)
			if (lastMinorIndex === -1) {
				// There were no spreads. They had it prepull, so assume this is 0
				lastMinorIndex = 0
			}

			// Modify log, they were holding onto this card since index
			_.forEachRight(this._cardStateLog,
				(stateItem, index) => {
					if (index >= lastMinorIndex) { stateItem.minorState = getAction(actionId) }
				})
			this._onMinorArcanaUse(event)
		}

		this._cardStateLog.push(cardStateItem)

	}

	_initPullState(event) {
		const actionId = event.ability.guid

		const pullStateItem = {
			lastEvent: null,
			rrAbility: null,
			drawState: null,
			spreadState: null,
			minorState: null,
		}

		if (EXPANDED_ARCANA_USE.includes(actionId)) {
			// They had an expanded RR first!

		}

		if (DRAWN_ARCANA_USE.includes(actionId)
			|| actionId === ACTIONS.MINOR_ARCANA.id
			|| actionId === ACTIONS.ROYAL_ROAD.id) {
			// They had something in the draw slot
			pullStateItem.drawState = getAction(actionId)
		}

		if (HELD_ARCANA_USE.includes(actionId)) {
			// They had something in spread
			pullStateItem.spreadState = getAction(actionId)
		}

		if (MINOR_ARCANA_USE.includes(actionId)) {
			// They had a minor arcana
			pullStateItem.minorState = getAction(actionId)
		}

		return pullStateItem
	}

	_onMinorArcanaUse(event) {
		this._minorArcanaHistory.push(event)
	}

	_onMinorArcana(event) {
		this._minorArcanaHistory.push(event)
	}

	_onSleeveDraw(event) {
		if (this.hasMinorArcana() > 0) {
			// Minor arcana lost
			this._minorArcanasLost++
		}

		this._minorArcanaHistory.push(event)
	}

	/**
	 * Digs the latest entries in _minorArcanaHistory to figure out if
	 * a) Minor Arcana casted OR
	 * b) Sleeve Draw casted
	 * without a MINOR_ARCANA_USE first to accompany it
	 *
	 *
	 * @return {int} 1 if slot is filled, 0 if empty, -1 if unknown (due to prepull or otherwise)
	 */
	hasMinorArcana() {
		if (this._minorArcanaHistory.length === 0) {
			return -1
		}

		const lastActionId = this._minorArcanaHistory[this._minorArcanaHistory.length - 1].ability.guid

		if (MINOR_ARCANA_USE.includes(lastActionId)) {
			return 0
		}

		if (lastActionId === ACTIONS.MINOR_ARCANA.id || lastActionId === ACTIONS.SLEEVE_DRAW.id) {
			return 0
		}

		return 1
	}

	_onComplete() {
		// console.log(this._minorArcanaHistory)
		console.log(this._cardStateLog)

		const sleeveUses = this._minorArcanaHistory.filter(artifact => artifact.ability.guid === ACTIONS.SLEEVE_DRAW.id).length

		this.suggestions.add(new Suggestion({
			icon: ACTIONS.MINOR_ARCANA.icon,
			content: <Fragment>
					Never use <ActionLink {...ACTIONS.SLEEVE_DRAW} /> before clearing your <ActionLink {...ACTIONS.MINOR_ARCANA} /> slot. You lose
					out on the opportunity to obtain another <ActionLink {...ACTIONS.LORD_OF_CROWNS} /> or <ActionLink {...ACTIONS.LADY_OF_CROWNS} /> for free.
			</Fragment>,
			severity: SEVERITY.MAJOR,
			why: <Fragment>
				{this._minorArcanasLost} of {sleeveUses} Sleeve Draws were used despite already having a filled Minor Arcana slot.
			</Fragment>,
		}))
	}

	output() {
		return <Fragment>

		</Fragment>
	}
}

