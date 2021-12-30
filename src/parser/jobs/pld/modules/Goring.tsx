import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink, ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions from 'parser/core/modules/Suggestions'
import React, {ReactNode} from 'react'
import {Accordion, Table} from 'semantic-ui-react'

const MAX_ALLOWED_CLIPPING = 3000

interface DotApplicationData {
	event: Events['statusApply'],
	clip?: number,
	source: Actor['id']
}

interface DotStatusData {
	lastApplication: number,
	applications: DotApplicationData []
}

type DotTargetData = Record<Status['id'], DotStatusData>

type DotApplicationTracker = Record<Actor['id'], DotTargetData>

export class Goring extends Analyser {
	static override handle = 'goring'
	static override title = t('pld.goring.title')`Goring Blade and Blade of Valor`
	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	private readonly statusDuration = {
		[this.data.statuses.GORING_BLADE.id]: this.data.statuses.GORING_BLADE.duration,
		[this.data.statuses.BLADE_OF_VALOR.id]: this.data.statuses.BLADE_OF_VALOR.duration,
	}

	private lastDotCast: Status['id'] = this.data.statuses.GORING_BLADE.id
	private clip: Record<Status['id'], number> = {
		[this.data.statuses.GORING_BLADE.id]: 0,
		[this.data.statuses.BLADE_OF_VALOR.id]: 0,
	}
	private tracker: DotApplicationTracker = {}
	private trackedClipping: boolean = false;

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.GORING_BLADE.id), this.onGoringCast)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.BLADE_OF_VALOR.id), this.onValorCast)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.GORING_BLADE.id), this.onGoringApply)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.BLADE_OF_VALOR.id), this.onValorApply)
		this.addEventHook('complete', this.onComplete)
	}

	private createTargetApplicationList() {
		return {
			[this.data.statuses.GORING_BLADE.id]: [],
			[this.data.statuses.BLADE_OF_VALOR.id]: [],
		}
	}

	private pushApplication(targetKey: string, statusId: number, event: Events['statusApply'], clip?: number) {
		const target = this.tracker[targetKey] = this.tracker[targetKey] || this.createTargetApplicationList()
		const source = this.lastDotCast
		target[statusId].applications.push({event, clip, source})
	}

	private onGoringCast(event: Events['action']) {
		this.lastDotCast = event.action
	}

	private onValorCast(event: Events['action']) {
		this.lastDotCast = event.action
	}

	private onGoringApply(event: Events['statusApply']) {
		const statusId = event.status

		// Make sure we're tracking for this target
		const applicationKey = event.target
		const trackerInstance = this.tracker[applicationKey] = this.tracker[applicationKey] || {}

		// If neither dot has been applied yet, initialize data and return
		if (trackerInstance[statusId] == null && trackerInstance[this.data.statuses.BLADE_OF_VALOR.id] == null) {
			trackerInstance[statusId] = {
				lastApplication: event.timestamp,
				applications: [],
			}
			//save the application for later use in the output
			this.pushApplication(applicationKey, statusId, event)
			return
		}

		// If only the opposite DoT has been used on this target, initialize data and move to clip calculation
		if (trackerInstance[statusId] == null && trackerInstance[this.data.statuses.BLADE_OF_VALOR.id] != null) {
			trackerInstance[statusId] = {
				lastApplication: 0,
				applications: [],
			}
		}

		// If Blade of Valor has been used on this target, get most recent previous DoT application timestamp
		let lastDotApplication = trackerInstance[statusId].lastApplication
		if (trackerInstance[this.data.statuses.BLADE_OF_VALOR.id] != null) {
			lastDotApplication = Math.max(lastDotApplication, trackerInstance[this.data.statuses.BLADE_OF_VALOR.id].lastApplication)
		}
		// Base clip calc
		let clip = this.statusDuration[statusId] - (event.timestamp - lastDotApplication)
		clip = Math.max(0, clip)
		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this.clip[statusId] += clip
		//save the application for later use in the output
		this.pushApplication(applicationKey, statusId, event, clip)
		trackerInstance[statusId].lastApplication = event.timestamp
		if (clip > MAX_ALLOWED_CLIPPING) {
			this.trackedClipping = true
		}
	}

	private onValorApply(event: Events['statusApply']) {
		const statusId = event.status

		// Make sure we're tracking for this target
		const applicationKey = event.target
		const trackerInstance = this.tracker[applicationKey] = this.tracker[applicationKey] || {}

		// If it's not been applied yet, set it and skip out
		if (trackerInstance[statusId] == null && trackerInstance[this.data.statuses.GORING_BLADE.id] == null) {
			trackerInstance[statusId] = {
				lastApplication: event.timestamp,
				applications: [],
			}
			//save the application for later use in the output
			this.pushApplication(applicationKey, statusId, event)
			return
		}

		// If only the opposite DoT has been used on this target, initialize data and move to clip calculation
		if (trackerInstance[statusId] == null && trackerInstance[this.data.statuses.GORING_BLADE.id] != null) {
			trackerInstance[statusId] = {
				lastApplication: 0,
				applications: [],
			}
		}

		// If Goring Blade has been used on this target, get most recent previous DoT application timestamp
		let lastDotApplication = trackerInstance[statusId].lastApplication
		if (trackerInstance[this.data.statuses.GORING_BLADE.id] != null) {
			lastDotApplication = Math.max(lastDotApplication, trackerInstance[this.data.statuses.GORING_BLADE.id].lastApplication)
		}
		// Base clip calc
		let clip = this.statusDuration[statusId] - (event.timestamp - lastDotApplication)
		clip = Math.max(0, clip)
		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this.clip[statusId] += clip
		//save the application for later use in the output
		this.pushApplication(applicationKey, statusId, event, clip)
		if (clip > MAX_ALLOWED_CLIPPING) {
			this.trackedClipping = true
		}
		trackerInstance[statusId].lastApplication = event.timestamp
	}

	// calculating separately in case we ever decide to split the outputs
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

		const combinedDotStatuses = target[this.data.statuses.GORING_BLADE.id].applications.concat(target[this.data.statuses.BLADE_OF_VALOR.id].applications)
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
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{combinedDotStatuses.map(
					(event) => {
						const thisClip = event.clip || 0
						const action = this.data.getAction(event.source)
						const icon = <ActionLink showName={false} {...action} />
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
		if (!this.trackedClipping) {
			return null
		}

		if (numTargets > 1) {
			const panels = Object.keys(this.tracker).map(applicationKey => {
				if (!this.createTargetStatusTable(this.tracker[applicationKey])) {
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
