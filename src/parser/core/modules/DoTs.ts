import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'

const SECONDS_PER_MINUTE = 60

/** Mapping of a status ID to the duration it was up. */
export interface DotDurations {
	[statusID: number]: number
}

interface DotTargets {
	[targetID: string]: DotDurations
}

export abstract class DoTs extends Analyser {
	static override handle = 'dots'

	@dependency protected data!: Data
	@dependency private actors!: Actors
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	/** Implementing modules MUST override this with a list of Status IDs. */
	protected abstract trackedStatuses: number[] = []

	private clips: DotDurations = {}
	private statusApplications: DotTargets = {}
	private statusDurations: DotDurations = {}

	override initialise() {
		this.addEventHook(filter<Event>()
			.type('statusApply')
			.source(this.parser.actor.id)
			.status(oneOf(this.trackedStatuses))
		, this.onApply)

		this.addEventHook('complete', this.onComplete)

		// NOTE: All statuses submodules track should include a duration property,
		//  otherwise the results this produces will be very fucky.
		this.trackedStatuses.forEach(statusID => {
			const status = this.data.getStatus(statusID)
			if (!status) { return } // return in forEach is like continue in for, don't ask me why.

			this.statusDurations[statusID] = status.duration ?? 0
		})

	}

	/** Implementing modules MUST override this to configure the checklist.
	 * This should be handled on a job-by-job basis rather than generically, since the description
	 * text isn't one-size-fits-all, and some jobs may have custom targets.
	 */
	protected abstract addChecklistRules(): void

	/** Implementing modules MUST override this to configure suggestions.
	 * This should be handled on a job-by-job basis rather than generically, since different jobs have
	 * different thresholds for what constitutes bad clipping with varying explanations as to why.
	 */
	protected abstract addClippingSuggestions(_clips: DotDurations): void

	/** Implementing modules can optionally exclude applications of a status from clipping calculations.
	 * (e.g. SMN rushing)
	 */
	protected excludeApplication() {
		return false
	}

	private onApply(event: Events['statusApply']) {
		const status = this.data.getStatus(event.status)
		const statusID = status?.id
		if (statusID == null) { return }

		// Make sure we're tracking for this target
		const target = event.target
		const lastApplication = this.statusApplications[target] ?? {}

		// If it's not been applied yet or should be excluded per job-specific logic (if any), set it and skip out
		if (lastApplication[statusID] == null || this.excludeApplication()) {
			lastApplication[statusID] = event.timestamp
			return
		}

		// Base clip calc
		let clip = this.statusDurations[statusID] - (event.timestamp - lastApplication[statusID])

		// Remove any untargetable time from the clip:
		//  often want to hardcast apply after an invuln phase, but refresh with another skill shortly after.
		clip -= this.invulnerability.getDuration({
			start: this.parser.fflogsToEpoch(event.timestamp - this.statusDurations[statusID]),
			end: this.parser.fflogsToEpoch(event.timestamp),
			types: ['untargetable'],
		})

		// Wait for when the status would typically drop without clipping:
		//  clipping a dot early isn't as problematic if it would just push it into invuln time.
		this.addTimestampHook(
			Math.min(
				event.timestamp + this.statusDurations[statusID] + clip,
				this.parser.eventTimeOffset + this.parser.pull.duration,
			),
			({timestamp}) => {
				clip -= this.invulnerability.getDuration({
					start: this.parser.fflogsToEpoch(event.timestamp),
					end: this.parser.fflogsToEpoch(timestamp),
					types: ['invulnerable'],
				})

				// Clamp clips at 0 - less than that is downtime, which is handled by the checklist requirement.
				this.clips[statusID] = (this.clips[statusID] ?? 0) + Math.max(0, clip)
			},
		)

		lastApplication[statusID] = event.timestamp
	}

	private onComplete() {
		this.addChecklistRules()
		this.addClippingSuggestions(this.clips)
	}

	// These two functions are helpers for submodules and should be used but not overridden
	public getUptimePercent(statusID: number) {
		const status = this.data.getStatus(statusID)
		if (status == null) { return 0 }

		const statusUptime = this.statuses.getUptime(status, this.actors.foes)
		const fightDuration = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusUptime / fightDuration) * 100
	}

	public getClippingAmount(statusID: number) {
		// This normalises clipping as seconds clipped per minute,
		// since some level of clipping is expected and we need tiers that work for both long and short fights
		const fightDurationMillis = (this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']}))
		if (fightDurationMillis <= 0) { return 0 }

		const clipSecsPerMin = Math.round(((this.clips[statusID] ?? 0) * SECONDS_PER_MINUTE) / fightDurationMillis)
		return clipSecsPerMin
	}
}
