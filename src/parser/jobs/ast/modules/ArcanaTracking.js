import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import _ from 'lodash'
import Module from 'parser/core/Module'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DRAWN_ARCANA, PLAY} from './ArcanaGroups'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const LINKED_EVENT_THRESHOLD = 20

// const MINOR_ARCANA_USE = [
// 	ACTIONS.LADY_OF_CROWNS.id,
// 	ACTIONS.LORD_OF_CROWNS.id,
// ]

const CARD_ACTIONS = [
	ACTIONS.DRAW.id,
	ACTIONS.REDRAW.id,
	ACTIONS.SLEEVE_DRAW.id,
	ACTIONS.MINOR_ARCANA.id,
	ACTIONS.UNDRAW.id,
	ACTIONS.DIVINATION.id,
	...PLAY,
]

const ARCANA_STATUSES = [
	STATUSES.THE_BALANCE.id,
	STATUSES.THE_BOLE.id,
	STATUSES.THE_ARROW.id,
	STATUSES.THE_SPEAR.id,
	STATUSES.THE_EWER.id,
	STATUSES.THE_SPIRE.id,
	STATUSES.LORD_OF_CROWNS.id,
	STATUSES.LADY_OF_CROWNS.id,
]

const PLAY_TO_STATUS_LOOKUP = _.zipObject(PLAY, [...DRAWN_ARCANA])

export default class ArcanaTracking extends Module {
	static handle = 'arcanaTracking'
	static dependencies = [
		'precastStatus', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'suggestions',
	]
	static title = t('ast.arcana-tracking.title')`Arcana Tracking`
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	_cardStateLog = [{
		lastEvent: null,
		drawState: null,
		seal1: null,
		seal2: null,
		seal3: null,
	}]
	_completeCardLog = []

	constructor(...args) {
		super(...args)

		const cardActionFilter = {
			by: 'player',
			abilityId: CARD_ACTIONS,
		}

		this.addHook('cast', cardActionFilter, this._onCast)
		this.addHook('applybuff', {by: 'player'}, this._onSelfBuff)
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
	 * This will run on applybuff. Looks for Arcanas Drawn statuses.
	 * The purpose is simply just to catch what card they got, since you can't tell what they drew from just the cast events alone.
	 * Expected to see something here after a cast of: DRAW, REDRAW.
	 *
	 * It works by comparing the event timestamp to the latest action taken, and then assumes it's related.
	 * TODO: There is a bug where if the user gets applybuff BEFORE the cast, it will not be picked up. We can't rely on event timestamps anymore.
	 */
	_onSelfBuff(event) {
		if (![...ARCANA_STATUSES, ...DRAWN_ARCANA].includes(event.ability.guid)) {
			return
		}

		if (DRAWN_ARCANA.includes(event.ability.guid)) {
			this._cardStateLog.forEach((stateItem) => {
				if (stateItem.lastEvent
					&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD)) {
					stateItem.drawState = getDataBy(STATUSES, 'id', event.ability.guid)
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
			this.retconSearch([ACTIONS.DRAW.id, ACTIONS.REDRAW.id, ACTIONS.MINOR_ARCANA.id], 'drawState', event.ability.guid)

			// b) check if this was a standalone statusoff/undraw, if so, add to logs
			const isPaired = this._cardStateLog.findIndex(stateItem => stateItem.lastEvent
				&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD))

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
	}

	/**
	 * Creates an Object duplicated from the previous known state of the Astrologian's spread, then modifies it based on the current action.
	 * Adds the Object to the array _cardStateLog.
	 *
	 * See _initPullState() for Object structure.
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

		if (PLAY.includes(actionId)) {
			cardStateItem.drawState = null

			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW
			this.retconSearch([ACTIONS.DRAW.id, ACTIONS.REDRAW.id, ACTIONS.MINOR_ARCANA.id], 'drawState', actionId)

		}

		if (actionId === ACTIONS.MINOR_ARCANA.id
			|| actionId === ACTIONS.UNDRAW.id
			|| actionId === ACTIONS.SPREAD.id
			|| actionId === ACTIONS.REDRAW.id) {
			cardStateItem.drawState = null
		}

		if (actionId === ACTIONS.SLEEVE_DRAW.id) {
			//
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
			drawState: null,
			slot1: null,
			slot2: null,
			slot3: null,
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

		if (PLAY.includes(actionId)) {
			// They had something in the draw slot
			this._cardStateLog[0].drawState = getDataBy(STATUSES, 'id', this.arcanaActionToStatus(actionId))
		}

	}

	_onComplete() {

		if (this._drawsOverwritten > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.MINOR_ARCANA.icon,
				content: <><Trans id="ast.arcana-tracking.suggestions.draw-overwrite.content">
						Never use <ActionLink {...ACTIONS.DRAW} /> if you have a card in the draw slot. It will overwrite it if you had <ActionLink {...ACTIONS.MINOR_ARCANA} />,
                        and Draw will go on cooldown without any effect if you had anything else.
				</Trans></>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="ast.arcana-tracking.suggestions.draw-overwrite.why">
					<Plural value={this._drawsOverwritten} one="# card" other="# cards" /> were overwritten or lost by using draw before playing the active card.
				</Trans>,
			}))
		}

	}

	/**
	 * Loops back to see if the specified card was in possession without the possiblity of it being obtained via legal abilities.
	 * This is presumed to mean they had it prepull, or since that latest ability. This function will then retcon the history since we know they had it.
     *
     * 5.0: Haha we only have one card slot now.
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
		if (slot === 'drawState' && [ACTIONS.UNDRAW.id, ...PLAY, ACTIONS.MINOR_ARCANA.id, ACTIONS.REDRAW.id].includes(latestActionId)) {
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
						if (index >= lastIndex) {
							stateItem[slot] = getDataBy(STATUSES, 'id', this.arcanaActionToStatus(cardId))
						}
					} else {
						if (index >= lastIndex && index !== this._cardStateLog.length - 1) {
							stateItem[slot] = getDataBy(STATUSES, 'id', this.arcanaActionToStatus(cardId))
						}
						if (index === this._cardStateLog.length - 1 && slot === 'rrAbility') {
							stateItem.lastEvent[slot] = getDataBy(STATUSES, 'id', this.arcanaActionToStatus(cardId))
						}
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
		if (PLAY.includes(arcanaId)) {
			arcanaId = PLAY_TO_STATUS_LOOKUP[arcanaId]
		}

		return arcanaId
	}

}

