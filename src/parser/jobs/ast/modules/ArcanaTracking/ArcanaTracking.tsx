import {t} from '@lingui/macro'
import {getDataBy} from 'data'
import {Data} from 'parser/core/modules/Data'
import {ActionRoot} from 'data/ACTIONS/root'
import {BuffEvent, CastEvent, DeathEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import PrecastStatus from 'parser/core/modules/PrecastStatus'
import {ARCANA_STATUSES, CELESTIAL_SEAL_ARCANA, DRAWN_ARCANA, LUNAR_SEAL_ARCANA, PLAY, SOLAR_SEAL_ARCANA} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {Event} from 'events'
import {InitEvent} from 'parser/core/Parser'

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
	lastEvent: InitEvent | CastEvent | DeathEvent
	drawState?: number // typeof DRAWN_ARCANA status ID. Only loaded at runtime. TODO: Types
	sealState: SealType[]
	sleeveState: SleeveType
}

// TODO: Try to track for when a seal was not given on pull due to latency?
export default class ArcanaTracking extends Module {
	static handle = 'arcanaTracking'
	static title = t('ast.arcana-tracking.title')`Arcana Tracking`
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data
	@dependency private precastStatus!: PrecastStatus

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
			timestamp: this.parser.fight.start_time,
		},
		drawState: undefined,
		sealState: CLEAN_SEAL_STATE,
		sleeveState: SleeveType.NOTHING,
	}]

	private lastDrawnBuff?: BuffEvent
	private pullStateInitialized = false
	private pullIndex = 0

	private prepullArcanas: BuffEvent[] = []

	protected init() {
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

		this.addEventHook('cast', {abilityId: this.CARD_ACTIONS, by: 'player'}, this.onCast)

		this.addEventHook('applybuff', {abilityId: this.ARCANA_STATUSES, by: 'player'}, this.onPrepullArcana)
		this.addEventHook('removebuff', {abilityId: this.ARCANA_STATUSES, by: 'player'}, this.offPrepullArcana)

		this.addEventHook('applybuff', {abilityId: this.DRAWN_ARCANA, by: 'player'}, this.onDrawnStatus)
		this.addEventHook('removebuff', {abilityId: this.DRAWN_ARCANA, by: 'player'}, this.offDrawnStatus)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
	}

	normalise(events: Event[]) {
		const startTime = this.parser.fight.start_time
		let prepullSleeve = true
		let prepullSleeveFabbed = false
		const sleeveDrawLog: CastEvent[] = []
		for (const event of events) {
			if (event.timestamp < startTime && event.type === 'cast' && this.data.actions.SLEEVE_DRAW.id === event.ability.guid) {
				// sleeve was already fabbed
				prepullSleeveFabbed = true
			}
			if (event.timestamp - startTime >= (this.data.statuses.SLEEVE_DRAW.duration * 1000)
			) {
				// End loop if: 1. Max duration of sleeve draw status passed
				break
			} else if (event.type === 'cast'
				&& this.data.actions.SLEEVE_DRAW.id === event.ability.guid
				&& event.timestamp >= startTime) {
				// they used sleeve so it can't have been prepull
				prepullSleeve = false
			} else if (event.type === 'cast' && this.data.actions.DRAW.id === event.ability.guid) {
				sleeveDrawLog.push(event)
			} else {
				continue
			}
		}

		// if they drew 2-3 cards in the first 30 sec, we can assume they had a sleeve draw
		if (prepullSleeve && _.inRange(sleeveDrawLog.length, SleeveType.TWO_STACK, SleeveType.TWO_STACK + 2)) {
			this.cardStateLog[0].sleeveState = sleeveDrawLog.length
			// prefab a sleeve draw if there isn't already
			if (!prepullSleeveFabbed) {
				events.splice(0, 0, {
					ability: {
						abilityIcon: sleeveDrawLog.length > 2 ? '019000/019562.png' : '019000/019561.png',
						guid: 7448,
						name: 'Sleeve Draw',
						type: 1,
					},
					sourceID: this.parser.player.id,
					sourceIsFriendly: true,
					targetID: this.parser.player.id,
					targetIsFriendly: true,
					type: 'cast',
					timestamp: startTime,
				})
			}
		}

		return events

	}

	public get cardLogs() {
		return this.cardStateLog
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the state. Defaults to pull state.
	 * @returns {CardState} - object containing the card state and last event
	 */
	public getCardState(timestamp = this.parser.fight.start_time): CardState | undefined {
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
	private onPrepullArcana(event: BuffEvent) {
		if (event.timestamp > this.parser.fight.start_time) {
			return
		}
		this.prepullArcanas.push(event)
	}

	/**
	 * Determine exactly when they casted their prepull arcana
	 * If they had overwritten this buff, it will falsly pull back the timestamp of their prepull cast, but since we are guessing, it may as well be the same.
	 */
	private offPrepullArcana(event: BuffEvent) {
		if (event.timestamp >= this.parser.fight.start_time + (this.data.statuses.THE_BALANCE.duration * 1000)) {
			return
		}

		this.prepullArcanas.forEach(arcanaBuff => {
			if (!(arcanaBuff.ability.guid === event.ability.guid
				&& arcanaBuff.targetID === event.targetID)) { return }

			const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
			const arcanaAction = getDataBy(this.data.actions, 'id', this.arcanaStatusToPlay(event.ability.guid))

			if (!arcanaAction) { return }

			const arcanaCastEvent: CastEvent = {
				ability: {
					name: arcanaAction.name,
					guid: arcanaAction.id as number,
					type: 1,
					abilityIcon: _.replace(_.replace(arcanaAction.icon, 'https://xivapi.com/i/', ''), '/', '-'),
				},
				timestamp: event.timestamp - (this.data.statuses.THE_BALANCE.duration * 1000),
				type: 'cast',
				sourceIsFriendly: true,
				targetIsFriendly: true,
				sourceID: event.sourceID,
				targetID: event.targetID,
			}
			cardStateItem.lastEvent = {...arcanaCastEvent}
			cardStateItem.drawState = undefined
			cardStateItem.sealState = CLEAN_SEAL_STATE

			this.cardStateLog.unshift(cardStateItem)
			this.pullIndex++

		})

	}

	// Just saves a class var for the last drawn status buff event for reference, to help minor arcana plays
	private onDrawnStatus(event: BuffEvent) {
		if (!this.DRAWN_ARCANA.includes(event.ability.guid)) {
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
	private offDrawnStatus(event: BuffEvent) {

		if (!this.DRAWN_ARCANA.includes(event.ability.guid)) {
			return
		}

		// a) check if this card was obtained legally, if not, retcon the logs
		this.retconSearch(this.arcanaDrawnToPlay(event.ability.guid))

		// b) check if this was a standalone statusoff/undraw, if so, fab undraw event and add to logs
		const isPaired = this.cardStateLog.some(stateItem => stateItem.lastEvent
			&& _.inRange(event.timestamp, stateItem.lastEvent.timestamp - LINKED_EVENT_THRESHOLD, stateItem.lastEvent.timestamp + LINKED_EVENT_THRESHOLD))

		if (!isPaired) {
			const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
			// fabbing an undraw cast event
			const lastEvent: CastEvent = {
				ability: {name: this.data.actions.UNDRAW.name, guid: this.data.actions.UNDRAW.id, type: 1, abilityIcon: _.replace(_.replace(this.data.statuses.NOCTURNAL_SECT.icon, 'https://xivapi.com/i/', ''), '/', '-')},
				timestamp: event.timestamp,
				type: 'cast',
				sourceIsFriendly: true,
				targetIsFriendly: true,
				sourceID: event.sourceID,
				targetID: event.sourceID,
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
	private onCast(event: CastEvent) {
		// For now, we're not looking at any other precast action other than Plays, which is handled by offPrepullArcana() to check removebuff instead of cast for better estimation
		if (event.timestamp < this.parser.fight.start_time) {
			return
		}
		const actionId = event.ability.guid
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

			if (cardStateItem.sleeveState > SleeveType.NOTHING) {
				cardStateItem.sleeveState = this.consumeSleeve(cardStateItem.sleeveState)
			}
		}

		if (actionId === this.data.actions.DIVINATION.id) {
			cardStateItem.sealState = CLEAN_SEAL_STATE
		}

		if (actionId === this.data.actions.UNDRAW.id) {
			cardStateItem.drawState = undefined
		}

		if (actionId === this.data.actions.SLEEVE_DRAW.id) {
			cardStateItem.sleeveState = this.startSleeve()
		}

		this.cardStateLog.push(cardStateItem)
	}

	/**
	 * Cards scattered all over the floor, covered with your blood
	 * Inserts a new event into _cardStateLogs
	 */
	private onDeath(event: DeathEvent) {

		// TODO: This is a duct tape fix
		// Checks on the previous event - it may be an erroneous drawnArcana flagged by offDrawnArcana. Statuses SEEM to drop 2s + 20ms earlier than the Death event.
		const lastCardState = {..._.last(this.cardStateLog)} as CardState
		if (lastCardState.lastEvent.type === 'cast' && lastCardState.lastEvent.ability.guid === this.data.actions.UNDRAW.id
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
	private initPullState(event: CastEvent) {
		const actionId = event.ability.guid

		// First check that there's no DRAW between this and pullIndex
		const lookupLog = this.cardStateLog.slice(this.pullIndex + 1)
		if (lookupLog.length > 0) {
			lookupLog.forEach(cardState => {
				if (cardState.lastEvent.type === 'cast'
					&& this.CARD_GRANTING_ABILITIES.includes(cardState.lastEvent.ability.guid)) {
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
		const latestActionId = lastLog.lastEvent.type === 'cast' ? lastLog.lastEvent.ability.guid : -1

		// We can skip search+replace for the latest card event if that was a way to lose a card in draw slot.
		// 1. The standard ways of losing something in draw slot.
		// 2. If they used Draw while holding a Minor Arcana or Draw
		const drawnStatusId = lastLog.drawState ? this.data.getStatus(lastLog.drawState) : undefined
		const isDrawnArcana = !!drawnStatusId
		if ([this.data.actions.UNDRAW.id, ...this.PLAY, this.data.actions.REDRAW.id].includes(latestActionId)
			|| (this.data.actions.DRAW.id === latestActionId && lastLog.drawState && this.DRAWN_ARCANA.includes(lastLog.drawState))
			|| (this.parser.patch.before('5.1') && [this.data.actions.MINOR_ARCANA.id].includes(latestActionId))) {
			searchLatest = false
		}

		const searchLog = searchLatest ? this.cardStateLog : this.cardStateLog.slice(0, this.cardStateLog.length - 1)

		// Looking for those abilities in CARD_GRANTING_ABILITIES that could possibly get us this card
		let lastIndex = _.findLastIndex(searchLog,
			stateItem => stateItem.lastEvent.type === 'init' || stateItem.lastEvent.type === 'cast' && this.CARD_GRANTING_ABILITIES.includes(stateItem.lastEvent.ability.guid),
		)

		// There were no finds of specified abilities, OR it wasn't logged.
		if (lastIndex === -1 || this.cardStateLog[lastIndex].drawState === undefined) {

			// If none were found, they had it prepull, so assume this is pullIndex
			lastIndex = lastIndex < 0 ? this.pullIndex : lastIndex

			// Modify log, they were holding onto this card since index
			// Differenciate depending on searchLatest
			let arcanaStatus: number | undefined
			if (!this.parser.patch.before('5.1') && this.lastDrawnBuff && this.CROWN_PLAYS.includes(cardActionId)) {
				arcanaStatus = this.lastDrawnBuff.ability.guid
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
