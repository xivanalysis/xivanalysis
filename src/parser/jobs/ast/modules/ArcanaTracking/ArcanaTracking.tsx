import {t} from '@lingui/macro'
import {getDataBy} from 'data'
import {ActionRoot} from 'data/ACTIONS/root'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {InitEvent} from 'parser/core/Parser'
import {ARCANA_STATUSES, CELESTIAL_SEAL_ARCANA, DRAWN_ARCANA, LUNAR_SEAL_ARCANA, PLAY, SOLAR_SEAL_ARCANA} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

const LINKED_EVENT_THRESHOLD = 20
const DEATH_EVENT_STATUS_DROP_DELAY = 2000

const CARD_GRANTING_ABILITIES: Array<keyof ActionRoot> = ['DRAW', 'REDRAW', 'MINOR_ARCANA', ...PLAY, 'SLEEVE_DRAW']

const CARD_ACTIONS: Array<keyof ActionRoot> = [
	'DRAW',
	'REDRAW',
	'SLEEVE_DRAW',
	'MINOR_ARCANA',
	'UNDRAW',
	'DIVINATION',
	...PLAY,
]
const CROWN_PLAYS: Array<keyof ActionRoot> = [
	'LORD_OF_CROWNS',
	'LADY_OF_CROWNS',
]

export enum SealType {
	NOTHING = 0,
	SOLAR = 1,
	LUNAR = 2,
	CELESTIAL = 3,
}
const CLEAN_SEAL_STATE = [SealType.NOTHING, SealType.NOTHING, SealType.NOTHING]

export enum SleeveType {
	NOTHING = 0,
	ONE_STACK = 1,
	TWO_STACK = 2,
}

export interface CardState {
	lastEvent: InitEvent | Events['action'] | Events['death']
	drawState?: number // typeof DRAWN_ARCANA status ID. Only loaded at runtime. TODO: Types
	sealState: SealType[]
	sleeveState: SleeveType
}

interface statusApplyWindow {
	data: Data
	status: Array<Events['statusApply']>
}

interface statusRemoveWindow {
	data: Data
	status: Array<Events['statusRemove']>
}

interface actionWindow {
	data: Data
	casts: Array<Events['action']>
}

// TODO: Try to track for when a seal was not given on pull due to latency?
export default class ArcanaTracking extends Analyser {
	static override handle = 'arcanaTracking'
	static override title = t('ast.arcana-tracking.title')`Arcana Tracking`
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data

	private PLAY: number[] = []
	private ARCANA_STATUSES: number[] = []
	private CARD_GRANTING_ABILITIES: number[] = []
	private CARD_ACTIONS: number[] = []
	private CROWN_PLAYS: number[] = []
	private DRAWN_ARCANA: number[] = []
	private CELESTIAL_SEAL_ARCANA: number[] = []
	private LUNAR_SEAL_ARCANA: number[] = []
	private SOLAR_SEAL_ARCANA: number[] = []

	private PLAY_TO_STATUS_LOOKUP: { [key: number]: number } = {}
	private STATUS_TO_DRAWN_LOOKUP: { [key: number]: number } = {}
	private STATUS_TO_PLAY_LOOKUP: { [key: number]: number } = {}
	private DRAWN_TO_PLAY_LOOKUP: { [key: number]: number } = {}

	private cardStateLog: CardState[] = [{
		lastEvent: {
			type: 'init',
			timestamp: this.parser.pull.timestamp,
		},
		drawState: undefined,
		sealState: CLEAN_SEAL_STATE,
		sleeveState: SleeveType.NOTHING,
	}]

	private lastDrawnBuff?: Events['statusApply']
	private pullStateInitialized = false
	private pullIndex = 0

	private on_prepullArcanas?: statusApplyWindow
	private off_prepullArcanas?: statusRemoveWindow
	private w_actions?: actionWindow

	override initialise() {
		// Initialize grouped reference to actions/statuses data
		PLAY.forEach(key => { this.PLAY.push(this.data.actions[key].id) })
		ARCANA_STATUSES.forEach(key => { this.ARCANA_STATUSES.push(this.data.statuses[key].id) })
		CARD_GRANTING_ABILITIES.forEach(key => { this.CARD_GRANTING_ABILITIES.push(this.data.actions[key].id) })
		CARD_ACTIONS.forEach(key => { this.CARD_ACTIONS.push(this.data.actions[key].id) })
		CROWN_PLAYS.forEach(key => { this.CROWN_PLAYS.push(this.data.actions[key].id) })
		DRAWN_ARCANA.forEach(key => { this.DRAWN_ARCANA.push(this.data.statuses[key].id) })
		CELESTIAL_SEAL_ARCANA.forEach(key => { this.CELESTIAL_SEAL_ARCANA.push(this.data.actions[key].id) })
		LUNAR_SEAL_ARCANA.forEach(key => { this.LUNAR_SEAL_ARCANA.push(this.data.actions[key].id) })
		SOLAR_SEAL_ARCANA.forEach(key => { this.SOLAR_SEAL_ARCANA.push(this.data.actions[key].id) })

		this.PLAY_TO_STATUS_LOOKUP = _.zipObject(this.PLAY, this.DRAWN_ARCANA)
		this.STATUS_TO_DRAWN_LOOKUP = _.zipObject(this.ARCANA_STATUSES, this.DRAWN_ARCANA)
		this.STATUS_TO_PLAY_LOOKUP = _.zipObject(this.ARCANA_STATUSES, this.PLAY)
		this.DRAWN_TO_PLAY_LOOKUP = _.zipObject(this.DRAWN_ARCANA, this.PLAY)

		const player_filter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(player_filter
			.type('action')
			.action(oneOf(this.CARD_ACTIONS))
		, this.onCast)

		this.addEventHook(player_filter
			.type('statusApply')
			.status(oneOf(this.ARCANA_STATUSES))
		, this.onPrepullArcana)
		this.addEventHook(player_filter
			.type('statusRemove')
			.status(oneOf(this.ARCANA_STATUSES))
		, this.offPrepullArcana)

		this.addEventHook(player_filter
			.type('statusApply')
			.status(oneOf(this.DRAWN_ARCANA))
		, this.onDrawnStatus)
		this.addEventHook(player_filter
			.type('statusRemove')
			.status(oneOf(this.DRAWN_ARCANA))
		, this.offDrawnStatus)

		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}
		, this.onDeath)

	}

	public get cardLogs() {
		return this.cardStateLog
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the state. Defaults to pull state.
	 * @returns {CardState} - object containing the card state and last event
	 */
	public getCardState(timestamp = this.parser.pull.timestamp): CardState | undefined {
		const stateItem = this.cardStateLog.find(artifact => artifact.lastEvent && timestamp > artifact.lastEvent.timestamp)
		return stateItem
	}

	/**
	 * @returns {CardState} - object containing the card state of the pull
	 */
	public getPullState(): CardState {
		const stateItem = this.cardStateLog.find(artifact => artifact.lastEvent && artifact.lastEvent.type === 'init') as CardState
		return stateItem
	}

	/**
	 * Adds the Arcana Buff to _prepullArcanas if it was a precast status
	 */
	private onPrepullArcana(event: Events['statusApply']) {
		if (event.timestamp > this.parser.pull.timestamp) {
			return
		}
		if (this.on_prepullArcanas != null) {
			this.on_prepullArcanas.status.push(event)
		}
	}

	/**
	 * Determine exactly when they casted their prepull arcana
	 * If they had overwritten this buff, it will falsly pull back the timestamp of their prepull cast, but since we are guessing, it may as well be the same.
	 */
	private offPrepullArcana(event: Events['statusRemove']) {
		if (event.timestamp >= this.parser.pull.timestamp + this.data.statuses.THE_BALANCE.duration) {
			return
		}
		if (this.off_prepullArcanas != null) {
			this.off_prepullArcanas.status.forEach(arcanaBuff => {
				if (!(arcanaBuff.status === event.status
				&& arcanaBuff.target === event.target)) { return }

				const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
				const arcanaAction = getDataBy(this.data.actions, 'id', this.arcanaStatusToPlay(event.status))

				if (!arcanaAction) { return }

				const arcanaCastEvent: Events['action'] = {
					action: arcanaAction.id as number,
					timestamp: event.timestamp - this.data.statuses.THE_BALANCE.duration - this.parser.pull.timestamp,
					type: 'action',
					source: event.source,
					target: event.target,
				}
				cardStateItem.lastEvent = {...arcanaCastEvent}
				cardStateItem.drawState = undefined
				cardStateItem.sealState = CLEAN_SEAL_STATE

				this.cardStateLog.unshift(cardStateItem)
				this.pullIndex++

			})
		}

	}

	// Just saves a class var for the last drawn status buff event for reference, to help minor arcana plays
	private onDrawnStatus(event: Events['statusApply']) {
		if (typeof event.data !== 'undefined' && !this.DRAWN_ARCANA.includes(event.data)) {
			return
		}
		this.lastDrawnBuff = event
	}

	/**
	 * This will run on removebuff. It will look for the loss of Arcanas Drawn statuses
	 * 5.0: This was a lot more meaningful when we had multiple statuses to track like royal road, held, drawn, etc.
	 * it's still useful now as it helps mitigate out-of-order log events (if that's still a thing anyway..)
	 *
	 * a) If it can't find any clear reason why the player had lost the buff, let's do a retconsearch to figure out since when they had it
	 *
	 * b) If they lost the buff with no link to any timestamp, it could be a /statusoff macro.
	 *    Creates a new entry as this is technically also a card action.
	 *
	 */
	private offDrawnStatus(event: Events['statusRemove']) {

		if (event.status != null && !this.DRAWN_ARCANA.includes(event.status)) {
			return
		}

		// a) check if this card was obtained legally, if not, retcon the logs
		this.retconSearch(this.arcanaDrawnToPlay(event.status))

		// b) check if this was a standalone statusoff/undraw, if so, fab undraw event and add to logs
		const isPaired = this.cardStateLog.some(stateItem => stateItem.lastEvent
			&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD))

		const isDeathPaired = this.cardStateLog.some(stateItem => stateItem.lastEvent
			&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD - DEATH_EVENT_STATUS_DROP_DELAY, stateItem.lastEvent.timestamp + DEATH_EVENT_STATUS_DROP_DELAY + LINKED_EVENT_THRESHOLD)
		&& stateItem.lastEvent.type === 'death')

		//TODO the above logic is ordered chronologically and for some reason doesn't capture deaths even with trying to account for death event types

		if (!isPaired && !isDeathPaired) {
			const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
			// fabbing an undraw cast event
			const lastEvent: Events['action'] = {
				action: this.data.actions.UNDRAW.id, //action: {name: this.data.actions.UNDRAW.name, guid: this.data.actions.UNDRAW.id, type: 1, abilityIcon: _.replace(_.replace(this.data.statuses.NOCTURNAL_SECT.icon, 'https://xivapi.com/i/', ''), '/', '-')},
				timestamp: event.timestamp,
				type: 'action',
				source: event.source,
				target: event.target,
			}

			cardStateItem.lastEvent = lastEvent
			cardStateItem.drawState = undefined
			this.cardStateLog.push(cardStateItem)
		}
	}

	/**
	 * MAIN DATA GATHERING LOOP
	 * Creates a CardState duplicated from the previous known state of the Astrologian's spread, then modifies it based on the current action.
	 * Adds the CardState to cardStateLog
	 *
	 */
	private onCast(event: Events['action']) {
		// For now, we're not looking at any other precast action other than Plays, which is handled by offPrepullArcana() to check removebuff instead of cast for better estimation

		if (event.timestamp < this.parser.pull.timestamp) {
			return
		}
		const actionId = event.action
		// Piecing together what they have on prepull
		if (!this.pullStateInitialized && this.PLAY.includes(actionId)) {
			this.initPullState(event)
		}

		const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState

		cardStateItem.lastEvent = event

		if (this.PLAY.includes(actionId)) {
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			this.retconSearch(actionId)

			cardStateItem.drawState = undefined

			// Work out what seal they got
			let sealObtained: SealType = SealType.NOTHING
			if (this.SOLAR_SEAL_ARCANA.includes(actionId)) {
				sealObtained = SealType.SOLAR
			} else if (this.LUNAR_SEAL_ARCANA.includes(actionId)) {
				sealObtained = SealType.LUNAR
			} else if (this.CELESTIAL_SEAL_ARCANA.includes(actionId)) {
				sealObtained = SealType.CELESTIAL
			}
			const sealState = [...cardStateItem.sealState]
			cardStateItem.sealState = this.addSeal(sealObtained, sealState)

			if (cardStateItem.sleeveState > SleeveType.NOTHING && this.parser.patch.before('5.3')) {
				cardStateItem.sleeveState = this.consumeSleeve(cardStateItem.sleeveState)
			}
		}

		if (actionId === this.data.actions.DIVINATION.id) {
			cardStateItem.sealState = CLEAN_SEAL_STATE
		}

		if (actionId === this.data.actions.UNDRAW.id) {
			cardStateItem.drawState = undefined
		}

		if (actionId === this.data.actions.SLEEVE_DRAW.id && this.parser.patch.before('5.3')) {
			// only happens pre 5.3
			cardStateItem.sleeveState = this.startSleeve()
		}

		this.cardStateLog.push(cardStateItem)
	}

	/**
	 * Cards scattered all over the floor, covered with your blood
	 * Inserts a new event into _cardStateLogs
	 */
	private onDeath(event: Events['death']) {

		// TODO: This is a duct tape fix
		// Checks on the previous event - it may be an erroneous drawnArcana flagged by offDrawnArcana. Statuses SEEM to drop 2s + 20ms earlier than the Death event.
		const lastCardState = {..._.last(this.cardStateLog)} as CardState
		if (lastCardState.lastEvent.type === 'action' && lastCardState.lastEvent.action === this.data.actions.UNDRAW.id
			&& (event.timestamp - lastCardState.lastEvent.timestamp <= DEATH_EVENT_STATUS_DROP_DELAY + LINKED_EVENT_THRESHOLD)) {
			this.cardStateLog.pop()
		}
		// Fab a death event
		this.cardStateLog.push({
			lastEvent: {
				...event,
			},
			drawState: undefined,
			sealState: CLEAN_SEAL_STATE,
			sleeveState: SleeveType.NOTHING,
		})
	}

	/**
	 * Initializes _cardStateLog pull entry for the first ever PLAY
	 * Looks for a previous DRAW. If none, then DRAW was made prepull. Updates pull state.
	 *
	 */
	private initPullState(event: Events['action']) {
		const actionId = event.action

		// First check that there's no DRAW between this and pullIndex
		const lookupLog = this.cardStateLog.slice(this.pullIndex + 1)
		if (lookupLog.length > 0) {
			lookupLog.forEach(cardState => {
				if (cardState.lastEvent.type === 'action'
					&& this.CARD_GRANTING_ABILITIES.includes(cardState.lastEvent.action)) {
					// We're done since they had a DRAW
					return this.pullStateInitialized = true
				}
			})
		}

		if (!this.pullStateInitialized && this.PLAY.includes(actionId)) {
			// They had something in the draw slot
			const drawnStatus = this.arcanaActionToStatus(actionId)
			this.cardStateLog.forEach((cardState, index) => {
				if (cardState.lastEvent.type === 'init') {
					this.cardStateLog[index].drawState = drawnStatus ? drawnStatus : undefined
					return this.pullStateInitialized = true
				}
			})
		}
	}

	/**
	 * Loops back to see if the specified card was in possession without the possiblity of it being obtained via legal abilities.
	 * This is presumed to mean they had it prepull, or since that latest ability. This function will then retcon the history since we know they had it.
	 * The reason why this is necessary is because some logs come with draw/buff/play out of order.
	 * Would be done in normaliser except we won't
	 *
	 * 5.0: Haha we only have one card slot now.
	 *
	 * @param actionId{array} The specified card drawn id
	 * @return {void} null
	 */
	private retconSearch(cardActionId: number) {
		let searchLatest = true
		const lastLog = _.last(this.cardStateLog) as CardState
		const latestActionId = lastLog.lastEvent.type === 'action' ? lastLog.lastEvent.action : -1

		// We can skip search+replace for the latest card event if that was a way to lose a card in draw slot.
		// 1. The standard ways of losing something in draw slot.
		// 2. If they used Draw while holding a Minor Arcana or Draw
		if ([this.data.actions.UNDRAW.id, ...this.PLAY, this.data.actions.REDRAW.id].includes(latestActionId)
			|| (this.data.actions.DRAW.id === latestActionId && lastLog.drawState && this.DRAWN_ARCANA.includes(lastLog.drawState))
			|| (this.parser.patch.before('5.1') && [this.data.actions.MINOR_ARCANA.id].includes(latestActionId))) {
			searchLatest = false
		}

		const searchLog = searchLatest ? this.cardStateLog : this.cardStateLog.slice(0, this.cardStateLog.length - 1)

		// Looking for those abilities in CARD_GRANTING_ABILITIES that could possibly get us this card
		let lastIndex = _.findLastIndex(searchLog,
			stateItem => stateItem.lastEvent.type === 'init' || stateItem.lastEvent.type === 'action' && this.CARD_GRANTING_ABILITIES.includes(stateItem.lastEvent.action),
		)

		// There were no finds of specified abilities, OR it wasn't logged.
		if (lastIndex === -1 || this.cardStateLog[lastIndex].drawState === undefined) {

			// If none were found, they had it prepull, so assume this is pullIndex
			lastIndex = lastIndex < 0 ? this.pullIndex : lastIndex

			// Modify log, they were holding onto this card since index
			// Differenciate depending on searchLatest
			let arcanaStatus: number | undefined
			if (!this.parser.patch.before('5.1') && this.lastDrawnBuff && this.CROWN_PLAYS.includes(cardActionId)) {
				arcanaStatus = this.lastDrawnBuff.data
			} else {
				arcanaStatus = this.arcanaActionToStatus(cardActionId)
			}

			_.forEachRight(this.cardStateLog,
				(stateItem, index) => {
					if (searchLatest && index >= lastIndex) {
						stateItem.drawState = arcanaStatus
					} else if (index >= lastIndex && index !== this.cardStateLog.length - 1) {
						stateItem.drawState = arcanaStatus
					}
				})
		}
	}

	// Helpers
	private addSeal(seal: SealType, sealState: SealType[]): SealType[] {
		if (!seal) {
			return sealState
		}
		sealState.shift()
		sealState.push(seal)
		return sealState
	}

	private startSleeve(): SleeveType {
		return SleeveType.TWO_STACK
	}

	private consumeSleeve(sleeveState: SleeveType): SleeveType {
		sleeveState--
		return _.clamp(sleeveState, SleeveType.NOTHING, SleeveType.TWO_STACK)
	}

	/**
	 * Flips an arcana action id to the matching arcana status id
	 *
	 * @param arcanaId{int} The ID of an arcana.
	 * @return {int} the ID of the arcana in status, or the same id received if it didn't match the flip lookup.
	 */
	public arcanaActionToStatus(arcanaId: number) {
		if (this.PLAY.includes(arcanaId)) {
			return this.PLAY_TO_STATUS_LOOKUP[arcanaId]
		}

		return undefined
	}

	/**
	 * Flips an arcana status id to the matching arcana drawn id
	 *
	 * @param arcanaId{int} The ID of an arcana status.
	 * @return {int} the ID of the arcana in drawn arcanas, or the same id received if it didn't match the flip lookup.
	 */
	public arcanaStatusToDrawn(arcanaId: number) {
		if (this.ARCANA_STATUSES.includes(arcanaId)) {
			arcanaId = this.STATUS_TO_DRAWN_LOOKUP[arcanaId]
		}

		return arcanaId
	}

	/**
	 * Flips an arcana status id to the matching arcana action id
	 *
	 * @param arcanaId{int} The ID of an arcana status.
	 * @return {int} the ID of the arcana in play, or the same id received if it didn't match the flip lookup.
	 */
	public arcanaStatusToPlay(arcanaId: number) {
		if (this.ARCANA_STATUSES.includes(arcanaId)) {
			arcanaId = this.STATUS_TO_PLAY_LOOKUP[arcanaId]
		}

		return arcanaId
	}

	/**
	 * Flips a drawn arcana status id to the matching arcana action id
	 *
	 * @param arcanaId{int} The ID of an arcana drawn status.
	 * @return {int} the ID of the arcana in play, or the same id received if it didn't match the flip lookup.
	 */
	public arcanaDrawnToPlay(arcanaId: number) {
		if (this.DRAWN_ARCANA.includes(arcanaId)) {
			arcanaId = this.DRAWN_TO_PLAY_LOOKUP[arcanaId]
		}

		return arcanaId
	}
}
