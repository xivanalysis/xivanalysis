import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Accordion, Table, Button} from 'semantic-ui-react'

const MAX_ALLOWED_CLIPPING = 3000

interface DotApplicationData {
	event: Events['statusApply'],
	clip?: number,
}

interface DotStatusData {
	applications: DotApplicationData []
}

type DotTargetData = {
	lastApplicationExpires: number,
	applicationHistory: Record<Status['id'], DotStatusData>
}

type DotApplicationTracker = Record<Actor['id'], DotTargetData>

export class Goring extends Analyser {
	static override handle = 'goring'
	static override title = t('pld.goring.title')`Goring Blade and Blade of Valor`
	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private timeline!: Timeline
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	private clip: Record<Status['id'], number> = {
		[this.data.statuses.GORING_BLADE.id]: 0,
		[this.data.statuses.BLADE_OF_VALOR.id]: 0,
	}
	private tracker: DotApplicationTracker = {}
	private trackedClipping: boolean = false;

	private trackedStatuses = [
		this.data.statuses.GORING_BLADE.id,
		this.data.statuses.BLADE_OF_VALOR.id,
	]

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(oneOf(this.trackedStatuses)), this.onApply)
		this.addEventHook('complete', this.onComplete)
	}

	private createDotTargetTracker(): DotTargetData {
		return {
			lastApplicationExpires: 0,
			applicationHistory: {
				[this.data.statuses.GORING_BLADE.id]: {applications: []},
				[this.data.statuses.BLADE_OF_VALOR.id]: {applications: []},
			},
		}
	}

	private pushApplication(event: Events['statusApply']) {
		const targetKey = event.target
		const status = this.data.getStatus(event.status)
		if (status?.duration == null) { return }
		let target = this.tracker[targetKey]
		if (target == null) {
			target = this.createDotTargetTracker()
			this.tracker[targetKey] = target
		}

		let clip = 0
		clip = target.lastApplicationExpires - event.timestamp
		clip = Math.max(0, clip)
		if (clip > MAX_ALLOWED_CLIPPING) {
			this.trackedClipping = true
		}

		target.applicationHistory[event.status].applications.push({event, clip})
		target.lastApplicationExpires = event.timestamp + status.duration
	}

	private onApply(event: Events['statusApply']) {
		this.pushApplication(event)
	}

	private getDotUptime(statusId: Status['id']) {
		const status = this.data.getStatus(statusId)
		if (status == null) { return 0 }

		const statusTime = this.statuses.getUptime(status, this.actors.foes)
		const uptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusTime / uptime) * 100
	}

	private onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="pld.goring.checklist.dots.name">Keep your DoTs up</Trans>,
			description: <Trans id="pld.goring.checklist.dots.description">
				As a Paladin, <DataLink action="GORING_BLADE" /> and <DataLink action="BLADE_OF_VALOR" /> are a significant portion of your sustained damage, and are required to be kept up for as much as possible for the best damage output.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="pld.goring.checklist.dots.requirement.name">Combined DoT uptime</Trans>,
					percent: () => this.getDotUptime(this.data.statuses.GORING_BLADE.id) + this.getDotUptime(this.data.statuses.BLADE_OF_VALOR.id),
				}),
			],
		}))
	}

	private createTargetStatusTable(target: DotTargetData) {
		let totalMajorDotClip = 0

		let combinedDotStatuses = []

		if (target.applicationHistory[this.data.statuses.GORING_BLADE.id] != null && target.applicationHistory[this.data.statuses.BLADE_OF_VALOR.id] != null) {
			combinedDotStatuses = target.applicationHistory[this.data.statuses.GORING_BLADE.id].applications.concat(target.applicationHistory[this.data.statuses.BLADE_OF_VALOR.id].applications)
		} else if (target.applicationHistory[this.data.statuses.GORING_BLADE.id] != null) {
			combinedDotStatuses = target.applicationHistory[this.data.statuses.GORING_BLADE.id].applications
		} else {
			combinedDotStatuses = target.applicationHistory[this.data.statuses.BLADE_OF_VALOR.id].applications
		}
		combinedDotStatuses.sort(
			(firstEvent, secondEvent) => (firstEvent.event.timestamp > secondEvent.event.timestamp ? 1 : -1)
		)
		const targetTable = <Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="pld.goring.applied">DoT Applied</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="pld.goring.clip">Clip</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="pld.goring.total-clip">Total Clip</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="pld.goring.source">Source</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{combinedDotStatuses.map(
					(event) => {
						const thisClip = event.clip || 0
						const status = this.data.getStatus(event.event.status)
						if (status?.duration == null) { return }
						const thisDuration = status.duration
						const icon = <StatusLink showName={false} {...status} />
						const renderClipTime = event.clip != null ? this.parser.formatDuration(event.clip) : '-'
						let clipSeverity: ReactNode = renderClipTime
						if (thisClip > MAX_ALLOWED_CLIPPING) {
							totalMajorDotClip += thisClip
							clipSeverity = <span className="text-error">{clipSeverity}</span>
							return <React.Fragment key={event.event.timestamp}>
								<Table.Row>
									<Table.Cell>{this.parser.formatEpochTimestamp(event.event.timestamp)}</Table.Cell>
									<Table.Cell>{clipSeverity}</Table.Cell>
									<Table.Cell>{totalMajorDotClip ? this.parser.formatDuration(totalMajorDotClip) : '-'}</Table.Cell>
									<Table.Cell style={{textAlign: 'center'}}>{icon}</Table.Cell>
									<Table.Cell>
										<Button onClick={() =>
											this.timeline.show(event.event.timestamp - this.parser.pull.timestamp - thisDuration + thisClip, event.event.timestamp - this.parser.pull.timestamp)}>
											<Trans id="pld.goring.timelinelink-button">Jump to Timeline</Trans>
										</Button>
									</Table.Cell>
								</Table.Row>
							</React.Fragment>
						}
					})}
			</Table.Body>
		</Table>
		if (totalMajorDotClip === 0) {
			return null
		}
		return targetTable
	}

	override output() {
		const numTargets = Object.keys(this.tracker).length
		if (numTargets === 0) { return null }

		// If there's no clipping worth mentioning, don't display a table
		if (this.trackedClipping === false) {
			return null
		}

		if (numTargets > 1) {
			const panels = Object.keys(this.tracker).map(applicationKey => {
				if (this.createTargetStatusTable(this.tracker[applicationKey]) == null) {
					return null
				}
				const target = this.actors.get(applicationKey)
				return {
					key: applicationKey,
					title: {
						content: <>{target.name}</>,
					},
					content: {
						content: this.createTargetStatusTable(this.tracker[applicationKey]),
					},
				}
			})
			return 	<>
				<Accordion
					exclusive={false}
					panels={panels}
					styled
					fluid
				/>
			</>

		}
		return 	<>
			{this.createTargetStatusTable(Object.values(this.tracker)[0])}
		</>
	}
}
