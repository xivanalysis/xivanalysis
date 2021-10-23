import Module from 'parser/core/Module'

// Absurdly large fallback number, so missing duration properties will result in both a console warning and stupid suggestions
const DEFAULT_DURATION_MILLIS = 120000

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'data',
		'enemies',
		'entityStatuses',
		'invulnerability',
	]

	// To be overriden by submodules with an array of status IDs to track
	statusesToTrack = []

	_lastApplication = {}
	_clip = {}
	_statusDuration = {}

	constructor(...args) {
		super(...args)
		// NOTE: All statuses submodules track should include a duration property, otherwise the results this produces will be very fucky
		this.constructor.statusesToTrack.forEach(statusId => {
			const status = this.data.getStatus(statusId)
			if (!status) { return }
			if (status.duration == null) {
				console.warn(`statusId ${statusId} is missing a duration property`)
				this._statusDuration[statusId] = DEFAULT_DURATION_MILLIS
			} else {
				this._statusDuration[statusId] = status.duration
			}
		})
		this.addEventHook(['applydebuff', 'refreshdebuff'], {by: 'player', abilityId: this.constructor.statusesToTrack}, this._onDotApply)
		this.addEventHook('complete', this._onComplete)
	}

	// *** FUNCTIONS TO OVERRIDE *** //
	excludeApplication() {
		// To be overridden by submodules that want to exclude certain applications from clipping calculations (e.g. SMN when rushing)
		return false
	}

	addChecklistRules() {
		// To be overridden by submodules to display the checklist rules for their job. This should be handled on a job-by-job
		// basis rather than generically, since the description text isn't one-size-fits-all, and some jobs may be tracking
		// more than just DoTs with this module (e.g. DRG's Disembowel).
	}

	// Allow Typescript overrides using the parameter
	addClippingSuggestions(_clip) {
		// To be overridden by submodules to display any clipping suggestions. This should also be handled on a job-by-job
		// basis, since different jobs have different thresholds for what constitutes bad clipping with varying explanations
		// for why.
	}
	// ***************************** //

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet or should be excluded per job-specific logic (if any), set it and skip out
		if (!lastApplication[statusId] || this.excludeApplication()) {
			lastApplication[statusId] = event.timestamp
			return
		}

		// Base clip calc
		let clip = this._statusDuration[statusId] - (event.timestamp - lastApplication[statusId])

		// Remove any untargetable time from the clip - often want to hardcast after an invuln phase, but refresh w/ 3D shortly after.
		clip -= this.invulnerability.getDuration({
			start: this.parser.fflogsToEpoch(event.timestamp - this._statusDuration[statusId]),
			end: this.parser.fflogsToEpoch(event.timestamp),
			types: ['untargetable'],
		})

		// Wait for when the status would typically drop without clipping - clipping a dot early isn't as problematic if it would
		// just push it into invuln time.
		this.addTimestampHook(
			Math.min(
				event.timestamp + this._statusDuration[statusId] + clip,
				this.parser.eventTimeOffset + this.parser.pull.duration,
			),
			({timestamp}) => {
				clip -= this.invulnerability.getDuration({
					start: this.parser.fflogsToEpoch(event.timestamp),
					end: this.parser.fflogsToEpoch(timestamp),
					types: ['invulnerable'],
				})

				// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
				this._clip[statusId] = (this._clip[statusId] || 0) + Math.max(0, clip)
			},
		)

		lastApplication[statusId] = event.timestamp
	}

	_onComplete() {
		this.addChecklistRules()
		this.addClippingSuggestions(this._clip)
	}

	// These two functions are helpers for submodules and should be used but not overridden
	getUptimePercent(statusId) {
		const statusUptime = this.entityStatuses.getStatusUptime(statusId, this.enemies.getEntities())
		const fightDuration = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusUptime / fightDuration) * 100
	}

	getClippingAmount(statusId) {
		// This normalises clipping as seconds clipped per minute, since some level of clipping is expected and we need tiers that work for both long and short fights
		const fightDurationMillis = (this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']}))
		if (fightDurationMillis <= 0) { return 0 }
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const clipSecsPerMin = Math.round(((this._clip[statusId] ?? 0) * 60) / fightDurationMillis)
		return clipSecsPerMin
	}
}
