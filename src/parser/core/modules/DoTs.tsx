import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {StatusLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import {ReactNode} from 'react'
import {Button, Message, Table} from 'semantic-ui-react'
import {Timeline} from './Timeline'

const MILLISECONDS_PER_MINUTE = 60000

type DotTracking = Map<Status['id'], Map<Actor['id'], DotTargetTracking>>
interface DotTargetTracking {
	lastApplied: number
	totalClipping: number
	applicationTimestamps: number[]
}

export abstract class DoTs extends Analyser {
	static override handle = 'dots'
	static override title = msg({id: 'core.dots.title', message: 'DoTs'})

	@dependency protected data!: Data
	@dependency private actors!: Actors
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses
	@dependency private timeline!: Timeline

	/** Implementing modules MUST override this with a list of Status IDs. */
	protected abstract trackedStatuses: Array<Status['id']>

	private statusApplications: DotTracking = new Map<Status['id'], Map<Actor['id'], DotTargetTracking>>()

	private statusDurationCache: {[key: Status['id']]: number} = {}

	override initialise() {
		this.trackedStatuses.forEach(statusId => this.statusDurationCache[statusId] = this.data.getStatus(statusId)?.duration ?? 0)

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
		// Cannot track for statuses that are not defined with a duration
		if (this.statusDurationCache[event.status] === 0) { return }

		// Get the tracking object for this status
		let trackedStatus = this.statusApplications.get(event.status)
		if (trackedStatus == null) {
			trackedStatus = new Map<string, DotTargetTracking>()
			this.statusApplications.set(event.status, trackedStatus)
		}

		// Get the tracking object for this status on this target
		const target = event.target
		let trackedStatusOnTarget = trackedStatus.get(target)
		if (trackedStatusOnTarget == null) {
			trackedStatusOnTarget = {
				lastApplied: 0,
				totalClipping: 0,
				applicationTimestamps: [],
			}
			trackedStatus.set(target, trackedStatusOnTarget)
		}

		trackedStatusOnTarget.applicationTimestamps.push(event.timestamp)

		// If it's not been applied yet or should be excluded per job-specific logic (if any), set it and skip out
		if (trackedStatusOnTarget.lastApplied === 0 || this.excludeApplication()) {
			trackedStatusOnTarget.lastApplied = event.timestamp
			return
		}

		// Base clip calc
		const clip = this.statusDurationCache[event.status] - (event.timestamp - trackedStatusOnTarget.lastApplied)
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
		const statusApplications = this.statusApplications.get(statusId)
		if (statusApplications == null) { return 0 }

		const actorIds = Array.from(statusApplications.keys())
		const actorUptimePercent = actorIds.reduce((uptime, actorId) => uptime + this.getUptimePercentForActor(statusId, actorId), 0)

		return actorUptimePercent / actorIds.length
	}

	private getUptimePercentForActor(statusId: Status['id'], actorId: Actor['id']) {
		const status = this.data.getStatus(statusId)
		if (status == null) { return 0 }
		const actor = this.actors.foes.find(foe => foe.id === actorId)
		if (actor == null) { return 0 }

		const statusUptime = this.statuses.getUptime(status, actor)
		const actorDuration = this.parser.pull.duration - this.invulnerability.getDuration({types: ['invulnerable'], actorFilter: actor => actor.id === actorId})

		return (statusUptime / actorDuration) * 100
	}

	// This normalises clipping as milliseconds clipped per minute,
	// since some level of clipping is expected and we need tiers that work for both long and short fights
	protected getClippingAmount(statusId: number) {
		const fightDuration = (this.parser.pull.duration - this.invulnerability.getDuration({types: ['invulnerable']}))
		if (fightDuration <= 0) { return 0 }

		const statusApplications = this.statusApplications.get(statusId)
		if (statusApplications == null) { return 0 }

		const totalClipping = Array.from(statusApplications.values()).reduce((clip, target) => clip + target.totalClipping, 0)
		const clipMSPerMin = Math.round(totalClipping / (fightDuration / MILLISECONDS_PER_MINUTE))
		return clipMSPerMin
	}

	override output(): ReactNode {
		const invulnApplications: Array<{
			timestamp: number,
			statusId: Status['id'],
			actorId: Actor['id'],
			invulnDuration: number,
		}> = []

		Array.from(this.statusApplications.keys()).forEach(statusId => {
			const statusApplications = this.statusApplications.get(statusId)
			if (statusApplications == null) { return }

			Array.from(statusApplications.keys()).forEach(actorId => {
				const actorStatusApplications = statusApplications.get(actorId)
				if (actorStatusApplications == null) { return }

				actorStatusApplications.applicationTimestamps.forEach((applicationTimestamp, index) => {
					/**
					 * We stop looking for invuln time at the earliest of:
					 * - The status falling off
					 * - The status getting overwritten
					 * - The end of the fight
					 */
					const effectiveEndTime = Math.min(
						applicationTimestamp + this.statusDurationCache[statusId],
						index < actorStatusApplications.applicationTimestamps.length - 1
							? actorStatusApplications.applicationTimestamps[index + 1]
							: this.parser.pull.timestamp + this.parser.pull.duration
					)
					const applicationInvuln = this.invulnerability.getDuration({
						types: ['invulnerable'],
						start: applicationTimestamp,
						end: effectiveEndTime,
						actorFilter: actor => actor.id === actorId,
					})
					if (applicationInvuln > 0) {
						invulnApplications.push({
							timestamp: applicationTimestamp,
							statusId,
							actorId,
							invulnDuration: applicationInvuln,
						})
					}
				})
			})
		})

		if (invulnApplications.length === 0) { return }

		return <>
			<Message>
				Something here about not applying when invuln is coming
			</Message>
			<Table compact unstackable celled collapsing>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell collapsing><Trans id="core.dots.table.time">Time</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="core.dots.table.status">Status</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="core.dots.table.target">Target</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="core.dots.table.">Time Invulnerable</Trans></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{
						invulnApplications.sort((a, b) => a.timestamp - b.timestamp).map(application => {
							const status = this.data.getStatus(application.statusId)
							return <Table.Row key={application.timestamp}>
								<Table.Cell textAlign="center">
									<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(application.timestamp)}</span>
									<Button
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(application.timestamp - this.parser.pull.timestamp - 15000, application.timestamp - this.parser.pull.timestamp + 15000)}
									/>
								</Table.Cell>
								<Table.Cell>
									<StatusLink {...status} />
								</Table.Cell>
								<Table.Cell>{this.actors.get(application.actorId).name}</Table.Cell>
								<Table.Cell>{this.parser.formatDuration(application.invulnDuration)}</Table.Cell>
							</Table.Row>
						})
					}
				</Table.Body>
			</Table>
		</>
	}
}
