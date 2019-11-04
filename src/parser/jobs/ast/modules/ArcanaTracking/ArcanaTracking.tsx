import {t} from '@lingui/macro'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent, DeathEvent, Event} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import PrecastStatus from 'parser/core/modules/PrecastStatus'
import {ARCANA_STATUSES, CELESTIAL_SEAL_ARCANA, DRAWN_ARCANA, LUNAR_SEAL_ARCANA, PLAY, SOLAR_SEAL_ARCANA} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

const LINKED_EVENT_THRESHOLD = 20
const DEATH_EVENT_STATUS_DROP_DELAY = 2000

const CARD_GRANTING_ABILITIES = [ACTIONS.DRAW.id, ACTIONS.REDRAW.id, ACTIONS.MINOR_ARCANA.id, ...PLAY, ACTIONS.SLEEVE_DRAW.id]

const CARD_ACTIONS = [
	ACTIONS.DRAW.id,
	ACTIONS.REDRAW.id,
	ACTIONS.SLEEVE_DRAW.id,
	ACTIONS.MINOR_ARCANA.id,
	ACTIONS.UNDRAW.id,
	ACTIONS.DIVINATION.id,
	...PLAY,
]

const PLAY_TO_STATUS_LOOKUP = _.zipObject(PLAY, DRAWN_ARCANA)
const STATUS_TO_DRAWN_LOOKUP = _.zipObject(ARCANA_STATUSES, DRAWN_ARCANA)
const STATUS_TO_PLAY_LOOKUP = _.zipObject(ARCANA_STATUSES, PLAY)
const DRAWN_TO_PLAY_LOOKUP = _.zipObject(DRAWN_ARCANA, PLAY)

export enum SealType {
	NOTHING = 0,
	SOLAR = 1,
	LUNAR = 2,
	CELESTIAL = 3,
}
const CLEAN_SEAL_STATE = [SealType.NOTHING, SealType.NOTHING, SealType.NOTHING]

export enum DrawnType {
	NOTHING = 0,
	BALANCE = STATUSES.BALANCE_DRAWN.id,
	BOLE = STATUSES.BOLE_DRAWN.id,
	ARROW = STATUSES.ARROW_DRAWN.id,
	SPEAR = STATUSES.SPEAR_DRAWN.id,
	EWER = STATUSES.EWER_DRAWN.id,
	SPIRE = STATUSES.SPIRE_DRAWN.id,
	LORD_OF_CROWNS = STATUSES.LORD_OF_CROWNS_DRAWN.id,
	LADY_OF_CROWNS = STATUSES.LADY_OF_CROWNS_DRAWN.id,
}

export enum SleeveType {
	NOTHING = 0,
	ONE_STACK = 1,
	TWO_STACK = 2,
}

interface PullEvent extends Event {
	type: 'pull'
}

export interface CardState {
	lastEvent: CastEvent | PullEvent | DeathEvent
	drawState: DrawnType
	sealState: SealType[]
	sleeveState: SleeveType
}

// TODO: Try to track for when a seal was not given on pull due to latency?
export default class ArcanaTracking extends Module {
	static handle = 'arcanaTracking'
	static title = t('ast.arcana-tracking.title')`Arcana Tracking`
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private precastStatus!: PrecastStatus

	private cardStateLog: CardState[] = [{
		lastEvent: {
			type: 'pull',
			timestamp: this.parser.fight.start_time,
			targetIsFriendly: true,
			sourceIsFriendly: true,
		},
		drawState: DrawnType.NOTHING,
		sealState: CLEAN_SEAL_STATE,
		sleeveState: SleeveType.NOTHING,
	}]
	private pullStateInitialized = false
	private pullIndex = 0

	private prepullArcanas: BuffEvent[] = []

	protected init() {
		this.addHook('cast', {abilityId: CARD_ACTIONS, by: 'player'}, this.onCast)

		this.addHook('applybuff', {abilityId: ARCANA_STATUSES, by: 'player'}, this.onPrepullArcana)
		this.addHook('removebuff', {abilityId: ARCANA_STATUSES, by: 'player'}, this.offPrepullArcana)

		this.addHook('removebuff', {abilityId: DRAWN_ARCANA, by: 'player'}, this.offDrawnStatus)
		this.addHook('death', {to: 'player'}, this.onDeath)
	}

	normalise(events: Event[]) {
		const startTime = this.parser.fight.start_time
		let prepullSleeve = true
		const sleeveDrawLog: CastEvent[] = []
		for (const event of events) {
			if (event.timestamp - startTime >= (STATUSES.SLEEVE_DRAW.duration * 1000)
				) {
					// End loop if: 1. Max duration of sleeve draw status passed
					break
				} else if ( event.type === 'cast' && this.isCastEvent(event) && ACTIONS.SLEEVE_DRAW.id === event.ability.guid) {
					// they used sleeve so it can't have been prepull
					prepullSleeve = false
				} else if (event.type === 'cast' && this.isCastEvent(event) && ACTIONS.DRAW.id === event.ability.guid) {
					sleeveDrawLog.push(event)
			}  else {
				continue
			}
		}

		// if they drew 2-3 cards in the first 30 sec, we can assume they had a sleeve draw
		if (prepullSleeve && _.inRange(sleeveDrawLog.length, SleeveType.TWO_STACK, SleeveType.TWO_STACK + 2)) {
			this.cardStateLog[0].sleeveState = sleeveDrawLog.length - 1
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
		const stateItem = this.cardStateLog.find(artifact => artifact.lastEvent && artifact.lastEvent.type === 'pull') as CardState
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
		if (event.timestamp >= this.parser.fight.start_time + (STATUSES.THE_BALANCE.duration * 1000)) {
			return
		}

		this.prepullArcanas.forEach(arcanaBuff => {
			if (!(arcanaBuff.ability.guid === event.ability.guid
				&& arcanaBuff.targetID === event.targetID)) { return }

			const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState
			const arcanaAction = getDataBy(ACTIONS, 'id', this.arcanaStatusToPlay(event.ability.guid))

			if (!arcanaAction) { return }

			const arcanaCastEvent: CastEvent = {
				ability: {
					name: arcanaAction.name,
					guid: arcanaAction.id as number,
					type: 1,
					abilityIcon: _.replace(_.replace(arcanaAction.icon, 'https://xivapi.com/i/', ''), '/', '-'),
				},
				timestamp: event.timestamp - (STATUSES.THE_BALANCE.duration * 1000),
				type: 'cast',
				sourceIsFriendly: true,
				targetIsFriendly: true,
				sourceID: event.sourceID,
				targetID: event.targetID,
			}
			cardStateItem.lastEvent = {...arcanaCastEvent}
			cardStateItem.drawState = DrawnType.NOTHING
			cardStateItem.sealState = CLEAN_SEAL_STATE

			this.cardStateLog.unshift(cardStateItem)
			this.pullIndex++

		})

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

		if (!DRAWN_ARCANA.includes(event.ability.guid)) {
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
				ability: {name: ACTIONS.UNDRAW.name, guid: ACTIONS.UNDRAW.id, type: 1, abilityIcon: _.replace(_.replace(STATUSES.NOCTURNAL_SECT.icon, 'https://xivapi.com/i/', ''), '/', '-')},
				timestamp: event.timestamp,
				type: 'cast',
				sourceIsFriendly: true,
				targetIsFriendly: true,
				sourceID: event.sourceID,
				targetID: event.sourceID,
			}

			cardStateItem.lastEvent = lastEvent
			cardStateItem.drawState = DrawnType.NOTHING

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
		if (!this.pullStateInitialized && PLAY.includes(actionId)) {
			this.initPullState(event)
		}

		const cardStateItem: CardState = {..._.last(this.cardStateLog)} as CardState

		cardStateItem.lastEvent = event

		if (PLAY.includes(actionId)) {
			cardStateItem.drawState = DrawnType.NOTHING
			// Make sure they have been holding onto this from the last instance of a DRAW/REDRAW/MINOR_ARCANA
			this.retconSearch(actionId)

			// Work out what seal they got
			let sealObtained: SealType = SealType.NOTHING
			if (SOLAR_SEAL_ARCANA.includes(actionId)) {
				sealObtained = SealType.SOLAR
			} else if (LUNAR_SEAL_ARCANA.includes(actionId)) {
				sealObtained = SealType.LUNAR
			} else if (CELESTIAL_SEAL_ARCANA.includes(actionId)) {
				sealObtained = SealType.CELESTIAL
			}
			const sealState = [...cardStateItem.sealState]
			cardStateItem.sealState = this.addSeal(sealObtained, sealState)

			if (cardStateItem.sleeveState > SleeveType.NOTHING) {
				cardStateItem.sleeveState = this.consumeSleeve(cardStateItem.sleeveState)
			}
		}

		if (actionId === ACTIONS.DIVINATION.id) {
			cardStateItem.sealState = CLEAN_SEAL_STATE
		}

		if (actionId === ACTIONS.UNDRAW.id) {
			cardStateItem.drawState = DrawnType.NOTHING
		}

		if (actionId === ACTIONS.SLEEVE_DRAW.id) {
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
		if (lastCardState.lastEvent.type === 'cast' && lastCardState.lastEvent.ability.guid === ACTIONS.UNDRAW.id
		&& (event.timestamp - lastCardState.lastEvent.timestamp <= DEATH_EVENT_STATUS_DROP_DELAY + LINKED_EVENT_THRESHOLD)) {
			this.cardStateLog.pop()
		}
		// Fab a death event
		this.cardStateLog.push({
			lastEvent: {
				...event,
			},
			drawState: DrawnType.NOTHING,
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
				&& CARD_GRANTING_ABILITIES.includes(cardState.lastEvent.ability.guid) ) {
					// We're done since they had a DRAW
					return this.pullStateInitialized = true
				}
			})
		}

		if (!this.pullStateInitialized && PLAY.includes(actionId)) {
			// They had something in the draw slot
			const drawnStatus = this.arcanaActionToStatus(actionId)
			this.cardStateLog.forEach((cardState, index) => {
				if (cardState.lastEvent.type === 'pull') {
					this.cardStateLog[index].drawState = drawnStatus ? drawnStatus : DrawnType.NOTHING
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
		let lastEvent = lastLog.lastEvent
		if (lastEvent.type === 'pull') {
			return
		}
		lastEvent = lastLog.lastEvent as CastEvent

		const latestActionId = lastEvent.ability.guid

		// We can skip search+replace for the latest card event if that was a way to lose a card in draw slot.
		// 1. The standard ways of losing something in draw slot.
		// 2. If they used Draw while holding a Minor Arcana or Draw
		if ([ACTIONS.UNDRAW.id, ...PLAY, ACTIONS.MINOR_ARCANA.id, ACTIONS.REDRAW.id].includes(latestActionId)
			|| (ACTIONS.DRAW.id === latestActionId && DRAWN_ARCANA.includes(lastLog.drawState))) {
			searchLatest = false
		}

		const searchLog = searchLatest ? this.cardStateLog : this.cardStateLog.slice(0, this.cardStateLog.length - 1)

		// Looking for those abilities in CARD_GRANTING_ABILITIES that could possibly get us this card
		let lastIndex = _.findLastIndex(searchLog,
			stateItem =>
				this.isCastEvent(stateItem.lastEvent) && CARD_GRANTING_ABILITIES.includes(stateItem.lastEvent.ability.guid),
		)

		// There were no finds of specified abilities, OR it wasn't logged.
		if (lastIndex === -1 || this.cardStateLog[lastIndex].drawState === DrawnType.NOTHING ) {

			// If none were found, they had it prepull, so assume this is pullIndex
			lastIndex = lastIndex < 0 ? this.pullIndex : lastIndex

			// Modify log, they were holding onto this card since index
			// Differenciate depending on searchLatest
			_.forEachRight(this.cardStateLog,
				(stateItem, index) => {
					if (searchLatest && index >= lastIndex) {
							stateItem.drawState = this.arcanaActionToStatus(cardActionId)
					} else if (index >= lastIndex && index !== this.cardStateLog.length - 1) {
							stateItem.drawState = this.arcanaActionToStatus(cardActionId)
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
		if (PLAY.includes(arcanaId)) {
			arcanaId = PLAY_TO_STATUS_LOOKUP[arcanaId]
		}

		return arcanaId
	}

	/**
	 * Flips an arcana status id to the matching arcana drawn id
	 *
	 * @param arcanaId{int} The ID of an arcana status.
	 * @return {int} the ID of the arcana in drawn arcanas, or the same id received if it didn't match the flip lookup.
	 */
	public arcanaStatusToDrawn(arcanaId: number) {
		if (ARCANA_STATUSES.includes(arcanaId)) {
			arcanaId = STATUS_TO_DRAWN_LOOKUP[arcanaId]
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
		if (ARCANA_STATUSES.includes(arcanaId)) {
			arcanaId = STATUS_TO_PLAY_LOOKUP[arcanaId]
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
		if (DRAWN_ARCANA.includes(arcanaId)) {
			arcanaId = DRAWN_TO_PLAY_LOOKUP[arcanaId]
		}

		return arcanaId
	}

	public isCastEvent = (event: Event): event is CastEvent => event.type === 'cast'
	public isBuffEvent = (event: Event): event is BuffEvent => event.type === 'buff'

}
