import {msg} from '@lingui/core/macro'
import {Action} from 'data/ACTIONS'
import {ActionRoot} from 'data/ACTIONS/root'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {InitEvent} from 'parser/core/Parser'
import {DRAW, PLAY_I, PLAY_II_III, PLAY_II, PLAY_III, MINOR_ARCANA, OFFENSIVE_ARCANA_STATUS, DEFENSIVE_ARCANA_STATUS} from '../ArcanaGroups'
import {DISPLAY_ORDER} from '../DISPLAY_ORDER'

const CARD_ACTIONS: Array<keyof ActionRoot> = [
	...PLAY_I,
	...PLAY_II_III,
	...MINOR_ARCANA,
]

interface CardSlotMap {
	slot1?: number // typeof DRAWN_ARCANA status ID. Only loaded at runtime. TODO: Types
	slot2?: number // typeof DRAWN_ARCANA status ID. Only loaded at runtime. TODO: Types
	slot3?: number // typeof DRAWN_ARCANA status ID. Only loaded at runtime. TODO: Types
	minorState?: number; // typeof DRAWN_CROWN_ARCANA status ID.
}

export interface CardState extends CardSlotMap {
	lastEvent: InitEvent | Events['action'] | Events['death']
}

// TODO: Try to track for when a seal was not given on pull due to latency?
export class ArcanaTracking extends Analyser {
	static override handle = 'arcanaTracking'
	static override title = msg({id: 'ast.arcana-tracking.title', message: 'Arcana Tracking'})
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data

	private draw: Array<Action['id']> = []
	private play: Array<Action['id']> = []
	private play2: Array<Action['id']> = []
	private play3: Array<Action['id']> = []
	private playMinorArcana: Array<Action['id']> = []
	private allplays: Array<Action['id']> = []
	private arcanaStatuses: Array<Status['id']> = []
	private astralArcanaSlotMap: CardSlotMap = {}
	private umbralArcanaSlotMap: CardSlotMap = {}
	private cardActions: Array<Action['id']> = []

	private playToStatusLookup: { [key: number]: number } = {}
	private statusToDrawnLookup: { [key: number]: number } = {}
	private statusToPlayLookup: { [key: number]: number } = {}

	private cardStateLog: CardState[] = [] //prepull handled in initPullState

	private prepullDealtWith: boolean = false

	override initialise() {
		// Initialize grouped reference to actions/statuses data
		this.draw = DRAW.map(actionKey => this.data.actions[actionKey].id)
		this.cardActions = CARD_ACTIONS.map(actionKey => this.data.actions[actionKey].id)

		this.play = PLAY_I.map(actionKey => this.data.actions[actionKey].id)
		this.play2 = PLAY_II.map(actionKey => this.data.actions[actionKey].id)
		this.play3 = PLAY_III.map(actionKey => this.data.actions[actionKey].id)
		this.playMinorArcana = MINOR_ARCANA.map(actionKey => this.data.actions[actionKey].id)
		this.allplays = this.play.concat(this.play2, this.play3, this.playMinorArcana)
		this.arcanaStatuses = OFFENSIVE_ARCANA_STATUS.map(statusKey => this.data.statuses[statusKey].id)
		this.arcanaStatuses = this.arcanaStatuses.concat(DEFENSIVE_ARCANA_STATUS.map(statusKey => this.data.statuses[statusKey].id))

		this.astralArcanaSlotMap = {
			slot1: this.data.statuses.THE_BALANCE.id,
			slot2: this.data.statuses.THE_ARROW.id,
			slot3: this.data.statuses.THE_SPIRE.id,
			minorState: this.data.statuses.LORD_OF_CROWNS_DRAWN.id,
		}
		this.umbralArcanaSlotMap = {
			slot1: this.data.statuses.THE_SPEAR.id,
			slot2: this.data.statuses.THE_BOLE.id,
			slot3: this.data.statuses.THE_EWER.id,
			minorState: this.data.statuses.LADY_OF_CROWNS_DRAWN.id,
		}

		this.statusToPlayLookup = _.zipObject(this.arcanaStatuses, this.play)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(oneOf(this.cardActions)),
			this.onCast
		)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(oneOf(this.draw)),
			this.onDraw
		)

		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)

		this.addEventHook('complete', this.onComplete)
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
	 * Draw handling for Astral Draw + Umbral Draw.
	 * 1. Overwrites the current spread with whatever comes out of the Draw action they just used.
	 * 2. Adds the CardState to cardStateLog
	 *
	 */
	private onDraw(event: Events['action']) {
		if (event.timestamp < this.parser.pull.timestamp) { return }
		if (!this.prepullDealtWith && event.timestamp > this.parser.pull.timestamp) {
			//pretend a draw happened before this based on whichever action is there
			this.initPullState(event)
		}

		const actionId = event.action
		const cardStateItem: CardState = {lastEvent: event}

		cardStateItem.lastEvent = event
		if (actionId === this.data.actions.ASTRAL_DRAW.id) {
			_.assign(cardStateItem, this.astralArcanaSlotMap)
		}

		if (actionId === this.data.actions.UMBRAL_DRAW.id) {
			_.assign(cardStateItem, this.umbralArcanaSlotMap)
		}

		this.cardStateLog.push(cardStateItem)

	}

	/**
	 * MAIN DATA GATHERING LOOP
	 * Creates a CardState duplicated from the previous known state of the Astrologian's spread, then modifies it based on the current action.
	 * Adds the CardState to cardStateLog
	 *
	 */
	private onCast(event: Events['action']) {
		// For now, we're not looking at any other precast action other than Plays, which is handled by offPrepullArcana() to check removebuff instead of cast for better estimation
		if (event.timestamp < this.parser.pull.timestamp) { return }

		const actionId = event.action

		// Piecing together what they have on prepull
		if (!this.prepullDealtWith && this.allplays.includes(actionId)) {
			this.initPullState(event)
		}

		const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState

		cardStateItem.lastEvent = event

		if (this.play.includes(actionId)) {
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			cardStateItem.slot1 = undefined
		}

		if (this.play2.includes(actionId)) {
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			cardStateItem.slot2 = undefined
		}

		if (this.play3.includes(actionId)) {
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			cardStateItem.slot3 = undefined
		}

		if (this.playMinorArcana.includes(actionId)) {
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			cardStateItem.minorState = undefined
		}

		this.cardStateLog.push(cardStateItem)
	}

	/**
	 * When dead drop cards into the void
	 */
	private onDeath(event: Events['death']) {
		this.cardStateLog.push({
			lastEvent: event,
		})
	}

	private onComplete() {
		//just incase an AST does nothing with their cards at least the initial state is there
		this.initPullState()
	}

	/**
	 * based on the first action, this will synth an initial draw depending on which draw or card was played
	 * If no actions were performed at all, (hell) synths the initial pull as it should be there
	 */
	private initPullState(event?: Events['action']) {
		if (this.prepullDealtWith) { return }
		this.prepullDealtWith = true
		//note if ASTRAL DRAW was performed, assume UMBRAL and vice versa. It looks awkward because we are synthing the previous draw
		if (event == null || [this.data.actions.UMBRAL_DRAW.id, this.data.actions.THE_BALANCE.id, this.data.actions.THE_ARROW.id, this.data.actions.THE_SPIRE.id].includes(event.action)) {
			this.cardStateLog.push({
				lastEvent: {
					type: 'init',
					timestamp: this.parser.pull.timestamp,
				},
				...this.astralArcanaSlotMap,
			})
			return
		}
		this.cardStateLog.push({
			lastEvent: {
				type: 'init',
				timestamp: this.parser.pull.timestamp,
			},
			...this.umbralArcanaSlotMap,
		})
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
}
