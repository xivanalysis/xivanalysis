import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'

const MILLISECONDS_PER_MINUTE = 60000

type DotTracking = Map<number, Map<string, DotTargetTracking>>
interface DotTargetTracking {
	lastApplied: number
	totalClipping: number
}

export abstract class DoTs extends Analyser {
	static override handle = 'dots'

	@dependency protected data!: Data
	@dependency private actors!: Actors
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	/** Implementing modules MUST override this with a list of Status IDs. */
	protected abstract trackedStatuses: number[] = []

	private statusApplications: DotTracking = new Map<number, Map<string, DotTargetTracking>>()

	override initialise() {
		this.addEventHook(
			filter<Event>()
				.type('statusApply')
				.source(this.parser.actor.id)
				.status(oneOf(this.trackedStatuses)),
			this.onApply,
		)

		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Implementing modules MUST override this to configure the checklist.
	 * This should be handled on a job-by-job basis rather than generically, since the description
	 * text isn't one-size-fits-all, and some jobs may have custom targets.
	 */
	protected abstract addChecklistRules(): void

	/**
	 * Implementing modules MUST override this to configure suggestions.
	 * This should be handled on a job-by-job basis rather than generically, since different jobs have
	 * different thresholds for what constitutes bad clipping with varying explanations as to why.
	 */
	protected abstract addClippingSuggestions(): void

	/**
	 * Implementing modules can optionally exclude applications of a status from clipping calculations.
	 * (e.g. SMN rushing)
	 */
	protected excludeApplication() {
		return false
	}

	private onApply(event: Events['statusApply']) {
		const status = this.data.getStatus(event.status)
		// Cannot track for statuses that are not defined with a duration
		if (status == null || status.duration == null) { return }

		// Get the tracking object for this status
		let trackedStatus = this.statusApplications.get(status.id)
		if (trackedStatus == null) {
			trackedStatus = new Map<string, DotTargetTracking>()
			this.statusApplications.set(status.id, trackedStatus)
		}

		// Get the tracking object for this status on this target
		const target = event.target
		let trackedStatusOnTarget = trackedStatus.get(target)
		if (trackedStatusOnTarget == null) {
			trackedStatusOnTarget = {lastApplied: 0, totalClipping: 0}
			trackedStatus.set(target, trackedStatusOnTarget)
		}

		// If it's not been applied yet or should be excluded per job-specific logic (if any), set it and skip out
		if (trackedStatusOnTarget.lastApplied === 0 || this.excludeApplication()) {
			trackedStatusOnTarget.lastApplied = event.timestamp
			return
		}

		// Base clip calc
		const clip = status.duration - (event.timestamp - trackedStatusOnTarget.lastApplied)
		// Cap clip at 0 - less than that is downtime, which is handled by the checklist requirement
		trackedStatusOnTarget.totalClipping += Math.max(0, clip)
		trackedStatusOnTarget.lastApplied = event.timestamp
	}

	private onComplete() {
		this.addChecklistRules()
		this.addClippingSuggestions()
	}

	// These two functions are helpers for submodules and should be used but not overridden
	protected getUptimePercent(statusId: number) {
		const status = this.data.getStatus(statusId)
		if (status == null) { return 0 }

		const statusUptime = this.statuses.getUptime(status, this.actors.foes)
		const fightDuration = this.parser.pull.duration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusUptime / fightDuration) * 100
	}

	protected getClippingAmount(statusId: number) {
		// This normalises clipping as seconds clipped per minute,
		// since some level of clipping is expected and we need tiers that work for both long and short fights
		const fightDurationMillis = (this.parser.pull.duration - this.invulnerability.getDuration({types: ['invulnerable']}))
		if (fightDurationMillis <= 0) { return 0 }

		const statusApplications = this.statusApplications.get(statusId)
		if (statusApplications == null) { return 0 }

		const totalClipping = Array.from(statusApplications.values()).reduce((clip, target) => clip + target.totalClipping, 0)
		const clipSecsPerMin = Math.round(totalClipping / (fightDurationMillis / MILLISECONDS_PER_MINUTE))
		return clipSecsPerMin
	}
}
