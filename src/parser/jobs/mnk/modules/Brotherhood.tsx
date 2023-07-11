import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, SeverityTiers, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {matchClosestHigher} from 'utilities'

const BROTHERHOOD_SEVERITY_TIERS: SeverityTiers = {
	0.00: SEVERITY.IGNORE,
	0.25: SEVERITY.MINOR,
	0.50: SEVERITY.MEDIUM,
	1.00: SEVERITY.MAJOR,
}

export interface BrotherhoodWindow {
	start: number
	end?: number
	targetsHit: number
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
export class Brotherhood extends Analyser {
	static override handle = 'brotherhood'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private matchedWindows: Map<number, MatchedBrotherhoodWindow> = new Map<number, MatchedBrotherhoodWindow>()
	private windows: BrotherhoodWindow[] = []
	private currentWindow?: BrotherhoodWindow
	private partySize: number = 0

	override initialise() {
		const partyMembers = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)

		this.partySize = partyMembers.length

		this.addEventHook(filter<Event>()
			.type('statusApply')
			.status(this.data.statuses.BROTHERHOOD.id)
			.source(this.parser.actor.id)
			.target(oneOf(partyMembers)),
		this.onApply)

		this.addEventHook(filter<Event>()
			.type('statusRemove')
			.status(this.data.statuses.MEDITATIVE_BROTHERHOOD.id)
			.source(this.parser.actor.id)
			.target(this.parser.actor.id),
		this.onRemove)

		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Memoized function that searches for a given Brotherhood window based on the start and
	 * end time of a separate window.
	 *
	 * Entries that are not matched are purposefully not stored within the map
	 */
	public findMatchingWindow(rofWindow: HistoryEntry<EvaluatedAction[]>): MatchedBrotherhoodWindow | undefined {
		if (this.matchedWindows.has(rofWindow.start)) {
			return this.matchedWindows.get(rofWindow.start)
		}

		const possibleWindow = this.searchForMatchingWindow(rofWindow)
		if (possibleWindow == null) {
			return undefined
		}

		this.matchedWindows.set(rofWindow.start, possibleWindow)
		return possibleWindow
	}

	private searchForMatchingWindow(rofWindow: HistoryEntry<EvaluatedAction[]>): MatchedBrotherhoodWindow | undefined {
		let validStart = false
		let validEnd = false
		let matchedWindow
		for (const bhWindow of this.windows) {
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

	get expectedTargetCount(): number {
		return this.partySize
	}

	/**
	 * Note: This will not produce correct data until AFTER the OnComplete function of
	 * the RiddleOfFire has occurred, as anytime before that the memoized map is still being
	 * constructed
	 */
	get unmatchedWindows(): BrotherhoodWindow[] {
		const foundEntries = Array.from(this.matchedWindows.values()).map(mw => mw.start)
		return _.filter(this.windows, window => !foundEntries.includes(window.start))
	}

	private onApply(event: Events['statusApply']) {
		if (this.currentWindow == null) {
			this.currentWindow = {
				start: event.timestamp,
				targetsHit: 0,
			}
		}

		this.currentWindow.targetsHit += 1
	}

	private onRemove(event: Events['statusRemove']) {
		if (this.currentWindow == null) {
			return
		}

		this.currentWindow.end = event.timestamp
		this.windows.push(this.currentWindow)
		this.currentWindow = undefined
	}

	private onComplete() {
		const expectedBuffs = this.windows.length * this.partySize
		const actualBuffs = _.sumBy(this.windows, 'targetsHit')

		const windowsWithMissedBuffs = this.windows.filter(w => w.targetsHit !== this.partySize).length

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BROTHERHOOD.icon,
			content: <Trans id="mnk.brotherhood.suggestions.missed-players.content">
				Try to make sure your <DataLink action="BROTHERHOOD"/> casts buff your full party with each use. Failing to do so is a raid damage loss.
			</Trans>,
			matcher: matchClosestHigher,
			tiers: BROTHERHOOD_SEVERITY_TIERS,
			value: (expectedBuffs - actualBuffs) / expectedBuffs,
			why: <Trans id="mnk.brotherhood.suggestions.missed-players.why">
				<Plural value={windowsWithMissedBuffs} one="# cast" other="# casts"/> of <DataLink action="BROTHERHOOD"/> missed hitting the entire party for a total of <Plural value={expectedBuffs - actualBuffs} one="# players" other="# players"/>.
			</Trans>,
		}))
	}
}
