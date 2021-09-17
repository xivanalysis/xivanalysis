import {Event, Events} from 'event'
import {CastEvent} from 'fflogs'
import {Analyser} from '../Analyser'
import {filter} from '../filter'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'

const MIN_ACTION_TIME = 1500

type AffectsWhichTime =
	| 'cast'
	| 'recast'
	| 'both'

export interface CastTimeAdjustment {
	actions: number[] | 'all',
	type: 'time' | 'percentage'
	adjustment: number,
	affectsWhich: AffectsWhichTime,
	start: number,
	end?: number
}

export default class CastTime extends Analyser {
	static override handle = 'castTime'

	@dependency data!: Data
	@dependency speedAdjustments!: SpeedAdjustments

	private castTimes: CastTimeAdjustment[] = []
	private scIndex: number | null = null

	override initialise() {
		// Only going to deal with SC here, job-specific can do it themselves
		const switftCastFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.SWIFTCAST.id)

		this.addEventHook(switftCastFilter.type('statusApply'), this.onApplySwiftcast)
		this.addEventHook(switftCastFilter.type('statusRemove'), this.onRemoveSwiftcast)
	}

	private onApplySwiftcast(): void {
		this.scIndex = this.setInstantCastAdjustment()
	}

	private onRemoveSwiftcast(): void {
		this.reset(this.scIndex)
		this.scIndex = null
	}

	// TODO: Update signatures to use objects instead of param vomit, separate PR tho
	/**
	 * setTimeAdjustment Module-compatibility function
	 * @deprecated
	 */
	public setTimeAdjustmentFflogs(actions: number[] | 'all', adjustment: number, start: number = this.parser.currentTimestamp, end?: number): number {
		return this.setTimeAdjustment(actions, adjustment, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : undefined)
	}
	/**
	 * Sets a cast time adjustment for a flat time amount per cast (See: Lightspeed, Dreadwyrm Trance, etc.)
	 * @param actions The actions this adjustment applies to. Either an array of IDs, or the string 'all'
	 * @param adjustment The amount of time that cast times are adjustmented by
	 * @param start The beginning of the adjustment time range. Defaults to the current epoch timestamp
	 * @param end The end of the adjustment time range. May be left null if the end of the range is not yet known
	 * @returns The index number within the cast time adjustments collection, can be used to reset/end this adjustment later
	 */
	public setTimeAdjustment(actions: number[] | 'all', adjustment: number, start: number = this.parser.currentEpochTimestamp, end?: number): number {
		return this.set({actions, adjustment, start, end, type: 'time', affectsWhich: 'cast'})
	}

	/**
	 * setInstantCastAdjustment Module-compatibility function
	 * @deprecated
	 */
	public setInstantCastAdjustmentFflogs(actions: number[] | 'all' = 'all', start: number = this.parser.currentTimestamp, end?: number): number {
		return this.setInstantCastAdjustment(actions, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : undefined)
	}
	/**
	 * Shorthand function for setting casts to instant (ie. Swiftcast, Triplecast)
	 * @param actions The actions this adjustment applies to. Either an array of IDs, or the string 'all'. Defaults to 'all'
	 * @param start The beginning of the adjustment time range. Defaults to the current epoch timestamp
	 * @param end The end of the adjustment time range. May be left null if the end of the range is not yet known
	 * @returns The end of the adjustment time range. May be left null if the end of the range is not yet known
	 */
	public setInstantCastAdjustment(actions: number[] | 'all' = 'all', start: number = this.parser.currentEpochTimestamp, end?: number): number {
		return this.setPercentageAdjustment(actions, 0, 'cast', start, end)
	}
	/**
	 * setPercentageAdjustment Module-compatibility function
	 * @deprecated
	 */
	public setPercentageAdjustmentFflogs(actions: number[] | 'all', adjustment: number, affectsWhich: AffectsWhichTime = 'cast', start: number = this.parser.currentTimestamp, end?: number): number {
		return this.setPercentageAdjustment(actions, adjustment, affectsWhich, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : undefined)
	}
	/**
	 * Sets a cast time adjustment for a percentage change per cast (See: Swiftcast, RDM's Doublecast trait, Ley Lines, etc.)
	 * @param actions The actions this adjustment applies to. Either an array of IDs, or the string 'all'
	 * @param adjustment The percentage multiplier to adjust the cast time to (ie 0 for instant cast, 0.85 for Ley Lines, 1.25 for a 25% slow)
	 * @param affectsWhich Does this percentage change affect the recast time, cast time, or both? Defaults to cast time
	 * @param start The beginning of the adjustment time range. Defaults to the current epoch timestamp
	 * @param end The end of the adjustment time range. May be left null if the end of the range is not yet known
	 * @returns The index number within the cast time adjustments collection, can be used to reset/end this adjustment later
	 */
	public setPercentageAdjustment(actions: number[] | 'all', adjustment: number, affectsWhich: AffectsWhichTime = 'cast', start: number = this.parser.currentEpochTimestamp, end?: number): number {
		return this.set({actions, adjustment, affectsWhich, start, end, type: 'percentage'})
	}
	private set(adjustment: CastTimeAdjustment): number {
		const newLength = this.castTimes.push(adjustment)

		return newLength - 1
	}

	/**
	 * reset Module-compatibility function
	 * @deprecated
	 */
	public resetFflogs(id: number | null, timestamp: number = this.parser.currentTimestamp): void {
		this.reset(id, this.parser.fflogsToEpoch(timestamp))
	}
	/**
	 * Sets the 'end' property of the specified cast time reduction range
	 * @param id The index within the cast times adjustment collection (provided by the set functions)
	 * @param timestamp The timestamp at which the reduction range ended. Defaults to the current epoch timestamp
	 */
	public reset(id: number | null, timestamp = this.parser.currentEpochTimestamp): void {
		if (id == null) { return }
		const ct = this.castTimes[id]
		if (!ct) { return }
		ct.end = timestamp
	}

	/**
	 * forEvent Module-compatibility function
	 * @deprecated
	 */
	public forFflogsEvent(event: CastEvent): number | undefined {
		return this.forAction(event.ability.guid, this.parser.fflogsToEpoch(event.timestamp))
	}
	/**
	 * Returns the effective cast time for the specified event
	 * @param event The event in question
	 * @returns The actual cast time, either as the default, or the modified time if any modifiers were in effect. Returns undefined if the action cannot be determined, or has no default cast time
	 */
	public forEvent(event: Events['action'] | Events['prepare']): number | undefined {
		return this.forAction(event.action, event.timestamp)
	}

	/**
	 * recastForEvent Module-compatibility function
	 * @deprecated
	 */
	public recastForFflogsEvent(event:CastEvent): number | undefined {
		return this.recastForAction(event.ability.guid, this.parser.fflogsToEpoch(event.timestamp))
	}
	/**
	 * Returns the effective recast time for the specified event
	 * @param event The event in question
	 * @returns The actual recast time, either as the default, or the modified time if any modifiers were in effect. Returns undefined i fthe action cannot be determined, or has no gcdRecast/cooldown property defined
	 */
	public recastForEvent(event: Events['action'] | Events['prepare']): number | undefined {
		return this.recastForAction(event.action, event.timestamp)
	}

	/**
	 * forAction Module-compatibility function
	 * @deprecated
	 */
	public forFflogsAction(actionId: number, timestamp: number = this.parser.currentTimestamp): number | undefined {
		return this.forAction(actionId, this.parser.fflogsToEpoch(timestamp))
	}
	/**
	 * Returns the effective cast time for the specified action at the specified point in time
	 * @param actionId The action in question
	 * @param timestamp The timestamp in question
	 * @returns The actual cast time, either as the default, or the modified time if any modifiers were in effect. Returns undefined if the action cannot be determined, or has no default cast time
	 */
	public forAction(actionId: number, timestamp: number = this.parser.currentEpochTimestamp): number | undefined {
		return this.getAdjustedTime(actionId, timestamp)
	}

	/**
	 * recastForAction Module-compatibility function
	 * @deprecated
	 */
	public recastForFflogsAction(actionId: number, timestamp: number = this.parser.currentTimestamp): number | undefined {
		return this.recastForAction(actionId, this.parser.fflogsToEpoch(timestamp))
	}
	/**
	 * Returns the effective recast time for the specified action at the specified point in time
	 * @param actionId The action in question
	 * @param timestamp Thetimestamp in question
	 * @returns The actual recast time, either as the default, or the modified time if any modifiers were in effect. Returns undefined if the action cannot be determined, or has no gcdRecast/cooldown property defined
	 */
	public recastForAction(actionId: number, timestamp: number = this.parser.currentEpochTimestamp): number | undefined {
		return this.getAdjustedTime(actionId, timestamp, 'recast')
	}

	/**
	 * Returns the adjusted time (either cast or recast) for the specified action at the specified point in time
	 * @param actionId The action in question
	 * @param timestamp The timestamp in question
	 * @param forWhich Do we want the recast for this action, or the cast time? Defaults to cast time
	 * @returns The adjusted time, if any adjustments exist at this timestamp, or the default if not. Will return undefined if the base time (recast/cooldown/cast) can't be determined
	 */
	private getAdjustedTime(actionId: number, timestamp: number = this.parser.currentEpochTimestamp, forWhich: AffectsWhichTime = 'cast'): number | undefined {
		// Get any cast time modifiers active when the event took place
		const matchingTimes = this.castTimes.filter(ct =>
			(ct.actions === 'all' || ct.actions.includes(actionId)) &&
			ct.start <= timestamp &&
			(ct.end == null || ct.end >= timestamp) &&
			(ct.affectsWhich === 'both' || ct.affectsWhich === forWhich),
		)

		const action = this.data.getAction(actionId)
		if (action == null) {
			return undefined
		}
		let defaultTime = forWhich === 'recast'
			? (action.gcdRecast != null ? action.gcdRecast : action.cooldown)
			: action.castTime

		// If the default comes back undefined, or already at or below the minimum action time (including instants), no adjustments to perform
		if (defaultTime == null || defaultTime <= MIN_ACTION_TIME) {
			return defaultTime
		}

		if (action.speedAttribute != null) {
			defaultTime = this.speedAdjustments.getAdjustedDuration({
				duration: defaultTime,
				attribute: action.speedAttribute,
			})
		}

		let flatReduction=0
		let flatIncrease=0
		let percentageAdjustment=1

		matchingTimes.forEach(ct => {
			if (ct.type === 'time') {
				// Find the largest flat cast time reduction value
				if (ct.adjustment < 0 && ct.adjustment < flatReduction) {
					flatReduction = ct.adjustment
				}
				// Find the largest flat cast time increase value
				if (ct.adjustment > 0 && ct.adjustment > flatIncrease)  {
					flatIncrease = ct.adjustment
				}
			} else if (ct.type === 'percentage') {
				// Get the total percentage adjustment
				percentageAdjustment *= ct.adjustment
			}
		})

		// Calculate the final cast time based on the flat and percentage reductions we've found
		const flatAdjustedTime = Math.max(defaultTime + flatIncrease + flatReduction, 0) // Yes, plus flatReduction because it's already a negative value
		if (flatAdjustedTime <= MIN_ACTION_TIME) {
			// Flat reductions reduced value below minimum action time, percentage adjustments will not be effective
			return flatAdjustedTime
		}

		if (percentageAdjustment === 0) {
			// Adjusted to instant
			return 0
		}

		// Apply percentage speed modifiers, subject to clamping at the minimum action time
		const adjustedTime = Math.max(flatAdjustedTime * percentageAdjustment, MIN_ACTION_TIME)
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		return Math.floor(adjustedTime / 10) * 10 // adjustments are rounded down to the nearest 10ms in game

		/**
		 * In the absence of easily-acquired slows to test with, I'm going to assume this is the right way to calculate this:
		 * - Lightspeed/DWT even with slow should still have normal 2.5s casts be instant
		 * - Swiftcast/Triple/Dualcast with slow should still be instant
		 * Unsure what the actual interaction between slow and a non-instant percentage change like Ley Lines or a > 2.5s cast with Lightspeed/DWT (aka Raise) would be with a slow
		 * We're also not tracking any slow statuses so this is probably overkill but hey, maybe Reaper or Sage will have a slow-myself-down-to-hit-harder mechanic .-.
		 */
	}
}
