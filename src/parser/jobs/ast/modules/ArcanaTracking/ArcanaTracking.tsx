import {t} from '@lingui/macro'
import {Action} from 'data/ACTIONS'
import {ActionRoot} from 'data/ACTIONS/root'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {ResourceGraphs} from 'parser/core/modules/ResourceGraphs'
import {InitEvent} from 'parser/core/Parser'
import {DAMAGE_INCREASE_STATUS, DAMAGE_INCREASE_ARCANA, DRAWN_ARCANA, HEAL_MIT_ARCANA, PLAY_I, REGEN_SHIELD_ARCANA} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

const LINKED_EVENT_THRESHOLD = 20
const DEATH_EVENT_STATUS_DROP_DELAY = 2000

const CARD_GRANTING_ABILITIES: Array<keyof ActionRoot> = [...PLAY_I]

const CARD_ACTIONS: Array<keyof ActionRoot> = [
	...PLAY_I,
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

// TODO: Try to track for when a seal was not given on pull due to latency?
export default class ArcanaTracking extends Analyser {
	static override handle = 'arcanaTracking'
	static override title = t('ast.arcana-tracking.title')`Arcana Tracking`
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data
	@dependency private resourceGraphs!: ResourceGraphs

	private play: Array<Action['id']> = []
	private arcanaStatuses: Array<Status['id']> = []
	private cardGrantingAbilities: Array<Action['id']> = []
	private cardActions: Array<Action['id']> = []
	private drawnArcana: Array<Status['id']> = []
	private celestialSealArcana: Array<Action['id']> = []
	private lunarSealArcana: Array<Action['id']> = []
	private solarSealArcana: Array<Action['id']> = []

	private playToStatusLookup: { [key: number]: number } = {}
	private statusToDrawnLookup: { [key: number]: number } = {}
	private statusToPlayLookup: { [key: number]: number } = {}
	private drawnToPlayLookup: { [key: number]: number } = {}

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

	private on_prepullArcanas?: Array<Events['statusApply']>
	private off_prepullArcanas?: Array<Events['statusRemove']>

	override initialise() {
		// Initialize grouped reference to actions/statuses data
		this.play = PLAY_I.map(actionKey => this.data.actions[actionKey].id)
		this.arcanaStatuses = DAMAGE_INCREASE_STATUS.map(statusKey => this.data.statuses[statusKey].id)
		this.cardGrantingAbilities = CARD_GRANTING_ABILITIES.map(actionKey => this.data.actions[actionKey].id)
		this.cardActions = CARD_ACTIONS.map(actionKey => this.data.actions[actionKey].id)
		this.drawnArcana = DRAWN_ARCANA.map(statusKey => this.data.statuses[statusKey].id)
		this.celestialSealArcana = DAMAGE_INCREASE_ARCANA.map(actionKey => this.data.actions[actionKey].id)
		this.lunarSealArcana = HEAL_MIT_ARCANA.map(actionKey => this.data.actions[actionKey].id)
		this.solarSealArcana = REGEN_SHIELD_ARCANA.map(actionKey => this.data.actions[actionKey].id)

		this.playToStatusLookup = _.zipObject(this.play, this.drawnArcana)
		this.statusToDrawnLookup = _.zipObject(this.arcanaStatuses, this.drawnArcana)
		this.statusToPlayLookup = _.zipObject(this.arcanaStatuses, this.play)
		this.drawnToPlayLookup = _.zipObject(this.drawnArcana, this.play)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(oneOf(this.cardActions)),
			this.onCast
		)

		this.addEventHook(
			playerFilter
				.type('statusApply')
				.status(oneOf(this.arcanaStatuses)),
			this.onPrepullArcana
		)
		this.addEventHook(
			playerFilter
				.type('statusRemove')
				.status(oneOf(this.arcanaStatuses)),
			this.offPrepullArcana
		)

		this.addEventHook(
			playerFilter
				.type('statusApply')
				.status(oneOf(this.drawnArcana)),
			this.onDrawnStatus
		)
		this.addEventHook(
			playerFilter
				.type('statusRemove')
				.status(oneOf(this.drawnArcana)),
			this.offDrawnStatus
		)

		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
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
			this.on_prepullArcanas.push(event)
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
			this.off_prepullArcanas.forEach(arcanaBuff => {
				if (!(arcanaBuff.status === event.status
				&& arcanaBuff.target === event.target)) { return }

				const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
				const arcanaAction = this.data.getAction(this.arcanaStatusToPlay(event.status))

				if (arcanaAction == null) { return }

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
		if (!this.drawnArcana.includes(event.status)) {
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

		if (!this.drawnArcana.includes(event.status)) {
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

		// TODO: the above logic is ordered chronologically and for some reason doesn't capture deaths even with trying to account for death event types

		if (!isPaired && !isDeathPaired) {
			const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
			// fabbing an undraw cast event
			const lastEvent: Events['action'] = {
				action: 0,
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
		if (!this.pullStateInitialized && this.play.includes(actionId)) {
			this.initPullState(event)
		}

		const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState

		cardStateItem.lastEvent = event

		if (this.play.includes(actionId)) {
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			this.retconSearch(actionId)

			cardStateItem.drawState = undefined

			// Work out what seal they got
			let sealObtained: SealType = SealType.NOTHING
			if (this.solarSealArcana.includes(actionId)) {
				sealObtained = SealType.SOLAR
			} else if (this.lunarSealArcana.includes(actionId)) {
				sealObtained = SealType.LUNAR
			} else if (this.celestialSealArcana.includes(actionId)) {
				sealObtained = SealType.CELESTIAL
			}
			const sealState = [...cardStateItem.sealState]
			cardStateItem.sealState = this.addSeal(sealObtained, sealState)
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
		if (lastCardState.lastEvent.type === 'action' && lastCardState.lastEvent.action === 0
			&& (event.timestamp - lastCardState.lastEvent.timestamp <= DEATH_EVENT_STATUS_DROP_DELAY + LINKED_EVENT_THRESHOLD)) {
			this.cardStateLog.pop()
		}
		// Fab a death event
		this.cardStateLog.push({
			lastEvent: {
				...event,
			},
			drawState: undefined,
			sealState: lastCardState.sealState,
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
					&& this.cardGrantingAbilities.includes(cardState.lastEvent.action)) {
					// We're done since they had a DRAW
					return this.pullStateInitialized = true
				}
			})
		}

		if (!this.pullStateInitialized && this.play.includes(actionId)) {
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
		const searchLatest = true
		//const lastLog = _.last(this.cardStateLog) as CardState
		//const latestActionId = lastLog.lastEvent.type === 'action' ? lastLog.lastEvent.action : -1

		// We can skip search+replace for the latest card event if that was a way to lose a card in draw slot.
		// 1. The standard ways of losing something in draw slot.
		// 2. If they used Draw while holding a Minor Arcana or Draw

		const searchLog = searchLatest ? this.cardStateLog : this.cardStateLog.slice(0, this.cardStateLog.length - 1)

		// Looking for those abilities in CARD_GRANTING_ABILITIES that could possibly get us this card
		let lastIndex = _.findLastIndex(searchLog,
			stateItem => stateItem.lastEvent.type === 'init' || stateItem.lastEvent.type === 'action' && this.cardGrantingAbilities.includes(stateItem.lastEvent.action),
		)

		// There were no finds of specified abilities, OR it wasn't logged.
		if (lastIndex === -1 || this.cardStateLog[lastIndex].drawState === undefined) {

			// If none were found, they had it prepull, so assume this is pullIndex
			lastIndex = lastIndex < 0 ? this.pullIndex : lastIndex

			// Modify log, they were holding onto this card since index
			// Differenciate depending on searchLatest
			const arcanaStatus: number | undefined = this.arcanaActionToStatus(cardActionId)

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

	/**
	 * Flips an arcana action id to the matching arcana status id
	 *
	 * @param arcanaId{int} The ID of an arcana.
	 * @return {int} the ID of the arcana in status, or the same id received if it didn't match the flip lookup.
	 */
	public arcanaActionToStatus(arcanaId: number) {
		if (this.play.includes(arcanaId)) {
			return this.playToStatusLookup[arcanaId]
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
		if (this.arcanaStatuses.includes(arcanaId)) {
			arcanaId = this.statusToDrawnLookup[arcanaId]
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
		if (this.arcanaStatuses.includes(arcanaId)) {
			arcanaId = this.statusToPlayLookup[arcanaId]
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
		if (this.drawnArcana.includes(arcanaId)) {
			arcanaId = this.drawnToPlayLookup[arcanaId]
		}

		return arcanaId
	}
}
