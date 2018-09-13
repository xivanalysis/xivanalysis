import React from 'react'
import _ from 'lodash'

import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES, {getStatus} from 'data/STATUSES'
import {ARCANA_USE, EXPANDED_ARCANA_USE, DRAWN_ARCANA_USE, HELD_ARCANA_USE, ROYAL_ROAD_STATES, DRAWN_ARCANA, HELD_ARCANA} from './ArcanaGroups'

import Module from 'parser/core/Module'

import {ActionLink} from 'components/ui/DbLink'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans, i18nMark, Plural} from '@lingui/react'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const LINKED_EVENT_THRESHOLD = 20

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

const DRAWN_ACTION_TO_STATUS_LOOKUP = _.zipObject(DRAWN_ARCANA_USE, [...DRAWN_ARCANA, ...DRAWN_ARCANA])
const HELD_ACTION_TO_STATUS_LOOKUP = _.zipObject(HELD_ARCANA_USE, [...HELD_ARCANA, ...HELD_ARCANA])

export default class ArcanaTracking extends Module {
	static handle = 'arcanaTracking'
	static dependencies = [
		'precastStatus', // eslint-disable-line xivanalysis/no-unused-dependencies
		'arcanum', // eslint-disable-line xivanalysis/no-unused-dependencies
		'suggestions',
	]
	static title = 'Arcana Tracking'
	static i18n_id = i18nMark('ast.arcana-tracking.title')
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	_cardStateLog = [{
		lastEvent: null,
		rrAbility: null,
		drawState: null,
		spreadState: null,
		minorState: null,
	}]
	_completeCardLog = []
	_minorArcanasLost = 0

	constructor(...args) {
		super(...args)

		const cardActionFilter = {
			by: 'player',
			abilityId: CARD_ACTIONS,
		}

		this.addHook('cast', cardActionFilter, this._onCast)
		this.addHook('applybuff', {by: 'player'}, this._onSelfBuff)
		this._onArcanaBuffHook = null
		this.addHook('removebuff', {by: 'player'}, this._offStatus)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	get getCardLogs() {
		if (this._cardStateLog.length === 0) {
			return []
		}
		return this._cardStateLog
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the state. Defaults to pull state.
	 * @returns {Object} - object containing the card state and last event
	 */
	getCardState(timestamp = this.parser.start_time) {
		const stateItem = this._cardStateLog.find(artifact => artifact.lastEvent && timestamp > artifact.lastEvent.timestamp)

		return stateItem
	}

	/**
	 * This will run on applybuff. Looks for Arcanas Drawn, Arcanas Held and Royal Road statuses.
	 * The purpose is simply just to catch what card they got, since you can't tell what they drew from just the cast events alone.
	 * Expected to see something here after a cast of: DRAW, REDRAW, SLEEVE_DRAW, ROYAL_ROAD, SPREAD.
	 *
	 * It works by comparing the event timestamp to the latest action taken, and then assumes it's related.
	 * TODO: There is a bug where if the user gets applybuff BEFORE the cast, it will not be picked up. We can't rely on event timestamps anymore.
	 */
	_onSelfBuff(event) {
		if (![...ARCANA_STATUSES, ...ROYAL_ROAD_STATES, ...DRAWN_ARCANA, ...HELD_ARCANA].includes(event.ability.guid)) {
			return
		}

		if (ROYAL_ROAD_STATES.includes(event.ability.guid)) {
			this._cardStateLog.forEach((stateItem) => {
				if (stateItem.lastEvent
					&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD)) {
					stateItem.rrAbility = getStatus(event.ability.guid)
				}
			})
		}

		if (DRAWN_ARCANA.includes(event.ability.guid)) {
			this._cardStateLog.forEach((stateItem) => {
				if (stateItem.lastEvent
					&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD)) {
					stateItem.drawState = getStatus(event.ability.guid)
				}
			})
		}

		if (HELD_ARCANA.includes(event.ability.guid)) {
			this._cardStateLog.forEach((stateItem) => {
				if (stateItem.lastEvent
					&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD)) {
					stateItem.spreadState = getStatus(event.ability.guid)
				}
			})
		}
	}

	/**
	 * This will run on removebuff. It will look for the loss of Arcanas Drawn, Arcanas Held and Royal Road statuses.
	 *
	 * a) If it can't find any clear reason why the player had lost the buff, it will assume they had it from prepull
	 *    (As an example: expanded balance 2 sec into pull before anything else should trigger this to fill in slots with Expanded RR and Balance)
	 * b) If they lost the buff with no link to any timestamp, it could be a /statusoff macro.
	 *    Creates a new entry as this is technically also a card action.
	 *
	 */
	_offStatus(event) {

		if (DRAWN_ARCANA.includes(event.ability.guid)) {
			// a) check if this card was obtained legally, if not, retcon the logs
			this.retconSearch([ACTIONS.DRAW.id, ACTIONS.SLEEVE_DRAW.id, ACTIONS.REDRAW.id], 'drawState', event.ability.guid)

			// b) check if this was a standalone statusoff/undraw, if so, add to logs
			const isPaired = this._cardStateLog.findIndex(stateItem => stateItem.lastEvent
				&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD))

			// TODO: Differenciate between draw timeouts and intentional undraws
			if (isPaired < 0) {
				const cardStateItem = {..._.last(this._cardStateLog)}
				const lastEvent = {
					ability: {...ACTIONS.UNDRAW, guid: ACTIONS.UNDRAW.id},
					timestamp: event.timestamp,
				}

				cardStateItem.lastEvent = lastEvent
				cardStateItem.drawState = null

				this._cardStateLog.push(cardStateItem)
			}

		}

		if (HELD_ARCANA.includes(event.ability.guid)) {

			// a) check if this existed, if not, retcon the logs
			this.retconSearch([ACTIONS.SPREAD.id, ACTIONS.SLEEVE_DRAW.id], 'spreadState', event.ability.guid)

			// b) check if this was a standalone statusoff/undraw, if so, add to logs
			const isPaired = this._cardStateLog.findIndex(stateItem => stateItem.lastEvent
				&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD))

			if (isPaired < 0) {
				const cardStateItem = {..._.last(this._cardStateLog)}
				const lastEvent = {
					ability: {...ACTIONS.UNDRAW_SPREAD, guid: ACTIONS.UNDRAW_SPREAD.id},
					timestamp: event.timestamp,
				}

				cardStateItem.lastEvent = lastEvent
				cardStateItem.spreadState = null

				this._cardStateLog.push(cardStateItem)
			}
		}

		if (ROYAL_ROAD_STATES.includes(event.ability.guid)) {

			// a) check if this existed, if not, retcon the logs
			this.retconSearch([ACTIONS.ROYAL_ROAD.id, ACTIONS.SLEEVE_DRAW.id], 'rrAbility', event.ability.guid)

			// b) check if this was a standalone statusoff/empty road, if so, add to logs
			const isPaired = this._cardStateLog.findIndex(stateItem => stateItem.lastEvent
				&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD))

			if (isPaired < 0) {
				const cardStateItem = {..._.last(this._cardStateLog)}
				const lastEvent = {
					ability: {...ACTIONS.EMPTY_ROAD, guid: ACTIONS.EMPTY_ROAD.id},
					timestamp: event.timestamp,
				}

				cardStateItem.lastEvent = lastEvent
				cardStateItem.rrAbility = null

				this._cardStateLog.push(cardStateItem)
			}

		}
	}

	/**
	 * This will run on applybuff, but only when the hook is enabled by the USE section in _onCast(). Looks for only Arcana buffs.
	 * removeHook is run at the end of this, so it only grabs the first arcanabuff on any party member after _onCast().
	 *
	 * a) Checks if we knew about the rrAbility (it only comes from SLEEVE_DRAW or ROYAL_ROAD.
	 *    If we didn't, then maybe they had it prepull. Retcons logs accordingly.
	 *
	 */
	_onArcanaBuff(event) {
		// this is coming right after an arcana cast with no rrAbility, so if there is, we need to go back and fix the log
		if (ARCANA_STATUSES.includes(event.ability.guid) && event.rrAbility) {
			let lastRoyalRoadIndex = _.findLastIndex(this._cardStateLog,
				stateItem =>
					stateItem.lastEvent &&
				(stateItem.lastEvent.ability.guid === ACTIONS.SLEEVE_DRAW.id
				|| stateItem.lastEvent.ability.guid === ACTIONS.ROYAL_ROAD.id)
			)

			if (lastRoyalRoadIndex === -1 || this._cardStateLog[lastRoyalRoadIndex].rrAbility === null) {
				// There were no RRs or Sleeve Draws, or the last one didn't capture the rrAbility.
				// If they didn't have any of those assume they had it prepull (0)
				lastRoyalRoadIndex = lastRoyalRoadIndex < 0 ? 0 : lastRoyalRoadIndex

				// Modify log, they were holding onto this rrAbility since index
				_.forEachRight(this._cardStateLog,
					(stateItem, index) => {
						if (index >= lastRoyalRoadIndex && index !== this._cardStateLog.length - 1) { stateItem.rrAbility = getStatus(event.rrAbility.guid) }
						if (index === this._cardStateLog.length - 1) { stateItem.lastEvent.rrAbility = getStatus(event.rrAbility.guid) }
					})
			}

			// this.retconSearch([ACTIONS.SLEEVE_DRAW.id, ACTIONS.ROYAL_ROAD.id], 'rrAbility', event.ability.guid)
		}

		this.removeHook(this._onArcanaBuffHook)
	}

	/**
	 * Creates an Object duplicated from the previous known state of the Astrologian's spread, then modifies it based on the current action.
	 * Adds the Object to the array _cardStateLog.
	 *
	 * See _initPullState() for Object structure.
	 *
	 * DRAWN_ARCANA_USE || HELD_ARCANA_USE
	 *
	 *
	 */
	_onCast(event) {
		const actionId = event.ability.guid

		// Piecing together what they have on prepull
		if (this._cardStateLog.length <= 1) {
			this._initPullState(event)
		}

		const cardStateItem = {..._.last(this._cardStateLog)}

		cardStateItem.lastEvent = event

		// If they used any arcana, consider the rrAbility consumed
		if (DRAWN_ARCANA_USE.includes(actionId) || HELD_ARCANA_USE.includes(actionId)) {

			// If this is the first Arcana they've played and there is no rrAbility, we won't know if there was an rrAbility.
			// We will examine the next arcanaBuff to check for an rrAbility.
			if (this._cardStateLog.findIndex(stateItem => stateItem.lastEvent
				&& [...ARCANA_USE, ...EXPANDED_ARCANA_USE].includes(stateItem.lastEvent.ability.guid)) === -1) {
				// Look out for the next arcana buff to check the rrState
				this._onArcanaBuffHook = this.addHook('applybuff', {by: 'player'}, this._onArcanaBuff)
			}

			cardStateItem.lastEvent.rrAbility = cardStateItem.rrAbility
			cardStateItem.rrAbility = null
		}

		if (DRAWN_ARCANA_USE.includes(actionId)) {
			cardStateItem.drawState = null

			// Make sure they have been holding onto this from the last instance of a DRAW/SLEEVE_DRAW/REDRAW
			this.retconSearch([ACTIONS.DRAW.id, ACTIONS.SLEEVE_DRAW.id, ACTIONS.REDRAW.id], 'drawState', actionId)

		}

		if (HELD_ARCANA_USE.includes(actionId)) {
			cardStateItem.spreadState = null

			// Make sure they have been holding onto this from the last instance of a SPREAD/SLEEVE_DRAW
			this.retconSearch([ACTIONS.SPREAD.id, ACTIONS.SLEEVE_DRAW.id], 'spreadState', actionId)
		}

		if (actionId === ACTIONS.ROYAL_ROAD.id) {
			const enhanced = [STATUSES.BALANCE_DRAWN.id, STATUSES.BOLE_DRAWN.id]
			const extended = [STATUSES.ARROW_DRAWN.id, STATUSES.SPEAR_DRAWN.id]
			const expanded = [STATUSES.EWER_DRAWN.id, STATUSES.SPIRE_DRAWN.id]

			if (cardStateItem.drawState && enhanced.includes(cardStateItem.drawState.id)) {
				cardStateItem.rrAbility = STATUSES.ENHANCED_ROYAL_ROAD
			}
			if (cardStateItem.drawState && extended.includes(cardStateItem.drawState.id)) {
				cardStateItem.rrAbility = STATUSES.EXTENDED_ROYAL_ROAD
			}
			if (cardStateItem.drawState && expanded.includes(cardStateItem.drawState.id)) {
				cardStateItem.rrAbility = STATUSES.EXPANDED_ROYAL_ROAD
			}

			cardStateItem.drawState = null
		}

		if (actionId === ACTIONS.MINOR_ARCANA.id
			|| actionId === ACTIONS.UNDRAW.id
			|| actionId === ACTIONS.SPREAD.id
			|| actionId === ACTIONS.REDRAW.id) {
			cardStateItem.drawState = null
		}

		if (actionId === ACTIONS.SLEEVE_DRAW.id) {
			cardStateItem.minorState = {
				name: 'Unknown',
			}
			if (_.last(this._cardStateLog).minorState) {
				// Minor arcana lost
				this._minorArcanasLost++
			}
		}

		if (actionId === ACTIONS.EMPTY_ROAD.id) {
			cardStateItem.rrAbility = null
		}
		if (actionId === ACTIONS.UNDRAW_SPREAD.id) {
			cardStateItem.spreadState = null
		}

		if (MINOR_ARCANA_USE.includes(actionId)) {
			cardStateItem.minorState = null

			let lastMinorIndex = _.findLastIndex(this._cardStateLog,
				stateItem =>
					stateItem.lastEvent &&
				(stateItem.lastEvent.ability.guid === ACTIONS.SLEEVE_DRAW.id
				|| stateItem.lastEvent.ability.guid === ACTIONS.MINOR_ARCANA.id)
			)

			if (lastMinorIndex === -1) {
				// There were no spreads. They had it prepull, so assume this is 0
				lastMinorIndex = 0
			}

			// Modify log, they were holding onto this card since index
			_.forEachRight(this._cardStateLog,
				(stateItem, index) => {
					if (index >= lastMinorIndex) { stateItem.minorState = getAction(actionId) }
				})
		}

		this._cardStateLog.push(cardStateItem)

	}

	/**
	 * Why'd you drop your cards!?
	 * Inserts a new event into _cardStateLogs
	 *
	 */
	_onDeath(event) {
		const cardStateItem = {
			rrAbility: null,
			drawState: null,
			spreadState: null,
			minorState: null,
		}

		cardStateItem.lastEvent = {
			...event,
			ability: {
				name: <Trans id="ast.arcana-tracking.messages.death">Death</Trans>,
				icon: ACTIONS.RAISE.icon,
				guid: ACTIONS.RAISE.id,
			},
			overrideDBlink: '1',
		}
		this._cardStateLog.push(cardStateItem)

	}

	/**
	 * Initializes _cardStateLog with an entry that has no "lastEvent"
	 * Attempts to make some basic inference about what they had on pull.
	 *
	 *	lastEvent: The most recent event via the "event" object passed into the hook.
	 *	rrAbility: The current rrAbility, via getStatus(id).
	 *	drawState: The current card Drawn as an ARCANA_DRAWN status.
	 *	spreadState: The current card Held as an ARCANA_HELD status.
	 *	minorState: The current Crowns card as the respective Action object.
	 *
	 *
	 */
	_initPullState(event) {
		const actionId = event.ability.guid

		if (EXPANDED_ARCANA_USE.includes(actionId)) {
			// They had an expanded RR first!
			this._cardStateLog[0].rrAbility = STATUSES.EXPANDED_ROYAL_ROAD
		}

		if (DRAWN_ARCANA_USE.includes(actionId)) {
			// They had something in the draw slot
			this._cardStateLog[0].drawState = getStatus(this.arcanaActionToStatus(actionId))
		}

		// if(actionId === ACTIONS.MINOR_ARCANA.id || actionId === ACTIONS.ROYAL_ROAD.id) {
		// 	// They had something in the draw slot but we can't tell what just by these events
		// }

		if (HELD_ARCANA_USE.includes(actionId)) {
			// They had something in spread
			this._cardStateLog[0].spreadState = getStatus(this.arcanaActionToStatus(actionId))
		}

		if (MINOR_ARCANA_USE.includes(actionId)) {
			// They had a minor arcana
			this._cardStateLog[0].minorState = getAction(actionId)
		}
	}

	_onComplete() {

		const sleeveUses = this._cardStateLog.filter(artifact => artifact.lastEvent && artifact.lastEvent.ability.guid === ACTIONS.SLEEVE_DRAW.id).length

		if (this._minorArcanasLost > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.MINOR_ARCANA.icon,
				content: <Trans id="ast.arcana-tracking.suggestions.sleeve-draw.content">
						Never use <ActionLink {...ACTIONS.SLEEVE_DRAW} /> before clearing your <ActionLink {...ACTIONS.MINOR_ARCANA} /> slot. You lose
						out on the opportunity to obtain another <ActionLink {...ACTIONS.LORD_OF_CROWNS} /> or <ActionLink {...ACTIONS.LADY_OF_CROWNS} /> for free.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="ast.arcana-tracking.suggestions.sleeve-draw.why">
					{this._minorArcanasLost} out of <Plural value={sleeveUses} one="# Sleeve Draw" other="# Sleeve Draws" /> were used despite already having a filled Minor Arcana slot.
				</Trans>,
			}))
		}

	}

	/**
	 * Loops back to see if the specified card was in possession without the possiblity of it being obtained via legal abilities.
	 * This is presumed to mean they had it prepull, or since that latest ability. This function will then retcon the history since we know they had it.
	 *
	 * @param abilityLookups{array} Array of abilities that determine how they obtained it.
	 * @param slot{array} The spread slot that this card id should have been visible
	 * @param actionId{array} The specified card id - this could be a status or an action - rrAbility,held,drawn
	 * @return {void} null
	 */
	retconSearch(abilityLookups, slot, cardId) {
		let searchLatest = true

		const latestActionId =  _.last(this._cardStateLog).lastEvent ? _.last(this._cardStateLog).lastEvent.ability.guid : null

		// These are the possible ways of losing something in each slot. If these were the latest, then we can skip search and replacing for that row.
		if (slot === 'spreadState' && [ACTIONS.UNDRAW_SPREAD.id, ...HELD_ARCANA_USE].includes(latestActionId)) {
			searchLatest = false
		}
		if (slot === 'drawState' && [ACTIONS.UNDRAW.id, ...DRAWN_ARCANA_USE, ACTIONS.ROYAL_ROAD.id, ACTIONS.MINOR_ARCANA.id, ACTIONS.REDRAW.id].includes(latestActionId)) {
			searchLatest = false
		}
		if (slot === 'rrAbility' && [ACTIONS.EMPTY_ROAD.id, ...DRAWN_ARCANA_USE, ...HELD_ARCANA_USE].includes(latestActionId)) {
			searchLatest = false
		}

		const searchLog = searchLatest ? this._cardStateLog : this._cardStateLog.slice(0, this._cardStateLog.length - 1)

		// Looking for those abilities that were given to us in abilityLookups.
		let lastIndex = _.findLastIndex(searchLog,
			stateItem =>
				stateItem.lastEvent &&
				abilityLookups.includes(stateItem.lastEvent.ability.guid)
		)

		// There were no finds of specified abilities, OR it wasn't logged.
		if (lastIndex === -1 || this._cardStateLog[lastIndex][slot] === null) {

			// If none were found, they had it prepull, so assume this is 0
			lastIndex = lastIndex < 0 ? 0 : lastIndex

			// Modify log, they were holding onto this card since index
			_.forEachRight(this._cardStateLog,
				(stateItem, index) => {
					if (searchLatest) {
						if (index >= lastIndex) { stateItem[slot] = getStatus(this.arcanaActionToStatus(cardId)) }
					} else {
						if (index >= lastIndex && index !== this._cardStateLog.length - 1) { stateItem[slot] = getStatus(this.arcanaActionToStatus(cardId)) }
						if (index === this._cardStateLog.length - 1 && slot === 'rrAbility') { stateItem.lastEvent[slot] = getStatus(this.arcanaActionToStatus(cardId)) }
					}
				})
		}
	}

	/**
	 * Flips an arcana action id to the matching arcana status id
	 *
	 * @param arcanaId{int} The ID of an arcana.
	 * @return {int} the ID of the arcana in status, or the same id received if it didn't match the flip lookup.
	 */
	arcanaActionToStatus(arcanaId) {
		if (DRAWN_ARCANA_USE.includes(arcanaId)) {
			arcanaId = DRAWN_ACTION_TO_STATUS_LOOKUP[arcanaId]
		}

		if (HELD_ARCANA_USE.includes(arcanaId)) {
			arcanaId = HELD_ACTION_TO_STATUS_LOOKUP[arcanaId]
		}

		return arcanaId
	}

}

