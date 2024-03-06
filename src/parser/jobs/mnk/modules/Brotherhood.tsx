import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {BrotherhoodDriftEvaluator, MissedBrotherhoodEvaluator} from './evaluators/BrotherhoodEvaluator'
import {RiddleOfFire} from './RiddleOfFire'

export interface BrotherhoodWindow {
	start: number
	end?: number
}

export interface MatchedBrotherhoodWindow extends BrotherhoodWindow {
	status: OverlapStatus
}

export enum OverlapStatus {
	USED_EARLY,
	IN_WINDOW,
	USED_LATE,
	OUT_OF_WINDOW,
}

/**
 * To account for BH + ROF > GCD weave.
 */
const BROTHERHOOD_DRIFT_TOLERANCE = 1500

/**
 * Tracks and stores brotherhood windows when used by the main actor and matches
 * said windows to provided RoF windows.
 */
export class Brotherhood extends RaidBuffWindow {
	static override handle = 'brotherhood'

	override buffStatus = this.data.statuses.BROTHERHOOD

	@dependency private riddleOfFire!: RiddleOfFire

	private windowOverlaps: Map<number, OverlapStatus> = new Map<number, OverlapStatus>()

	override initialise() {
		super.initialise()

		this.addEvaluator(new BrotherhoodDriftEvaluator({
			suggestionIcon: this.data.actions.BROTHERHOOD.icon,
			getOverlapStatus: this.getOverlapStatus.bind(this),
		}))

		this.addEvaluator(new MissedBrotherhoodEvaluator({
			suggestionIcon: this.data.actions.BROTHERHOOD.icon,
			getOverlapStatus: this.getOverlapStatus.bind(this),
		}))
	}

	/**
	 * Memoized function that searches for a given Brotherhood window based on the start and
	 * end time of a separate window.
	 *
	 * Entries that are not matched are purposefully not stored within the map
	 */
	public getOverlapStatus(window: HistoryEntry<EvaluatedAction[]>): OverlapStatus {
		if (this.windowOverlaps.has(window.start)) {
			return this.windowOverlaps.get(window.start) ?? OverlapStatus.OUT_OF_WINDOW
		}

		const possibleWindow = this.searchForMatchingWindow(window)
		if (possibleWindow == null) {
			return OverlapStatus.OUT_OF_WINDOW
		}

		this.windowOverlaps.set(window.start, possibleWindow.status)
		return possibleWindow.status
	}

	private searchForMatchingWindow(bhWindow: HistoryEntry<EvaluatedAction[]>): MatchedBrotherhoodWindow | undefined {
		let validStart = false
		let validEnd = false
		let matchedWindow
		for (const rofWindow of this.riddleOfFire.windows) {
			// If within tolerance and first GCD of both windows is equivalent, then we consider both
			// as "starting" at the same time
			const beforeBrotherhood = rofWindow.start <= (bhWindow.start + BROTHERHOOD_DRIFT_TOLERANCE)
			const startInWindow = (rofWindow.end == null || bhWindow.start <= rofWindow.end)

			validStart = beforeBrotherhood && startInWindow

			const unendedWindow = rofWindow.end == null && (bhWindow.end == null || rofWindow.start <= bhWindow.end)
			const endInWindow = rofWindow.end != null && bhWindow.end != null && rofWindow.start <= bhWindow.end && bhWindow.end <= rofWindow.end
			validEnd =  unendedWindow || endInWindow

			if (validStart || validEnd) {
				matchedWindow = bhWindow
				break
			}
		}

		if (!matchedWindow) {
			return undefined
		}

		let status = OverlapStatus.OUT_OF_WINDOW
		if (validStart && !validEnd) {
			status = OverlapStatus.USED_LATE
		} else if (validStart && validEnd) {
			status = OverlapStatus.IN_WINDOW
		} else if (!validStart && validEnd) {
			status = OverlapStatus.USED_EARLY
		}

		return {...matchedWindow, status}
	}
}
