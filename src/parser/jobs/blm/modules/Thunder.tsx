import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink, ActionLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import styles from 'components/ui/Procs/ProcOverlay.module.css'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {ReactNode} from 'react'
import {Accordion, Table, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import Procs from './Procs'

const MAX_ALLOWED_BAD_GCD_THRESHOLD = 2000
const MAX_ALLOWED_T3_CLIPPING = 3000

interface ThunderApplicationData {
	event: Events['statusApply'],
	clip?: number,
	source: number,
	proc: boolean
}
interface ThunderStatusData {
	lastApplication: number,
	applications: ThunderApplicationData[]
}
interface ThunderTargetData {
	[key: number]: ThunderStatusData,
}
interface ThunderApplicationTracker {
	[key: string]: ThunderTargetData,
}

export class Thunder extends Analyser {
	static override handle = 'thunder'
	static override title = t('blm.thunder.title')`Thunder`
	static override displayOrder = DISPLAY_ORDER.THUNDER

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private procs!: Procs
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	// Can never be too careful :blobsweat:
	private readonly STATUS_DURATION = {
		[this.data.statuses.THUNDER_III.id]: this.data.statuses.THUNDER_III.duration,
		[this.data.statuses.THUNDERCLOUD.id]: this.data.statuses.THUNDERCLOUD.duration,
	}

    private thunder3Casts = 0
    private lastThunderProc: boolean = false
    private lastThunderCast: number = this.data.statuses.THUNDER_III.id
	private clip: {[key: number]: number} = {
		[this.data.statuses.THUNDER_III.id]: 0,
	}
	private tracker: ThunderApplicationTracker = {}

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.THUNDER_III.id), this.onDotCast)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.THUNDER_III.id), this.onDotApply)
		this.addEventHook('complete', this.onComplete)
	}

	private createTargetApplicationList() {
		return {
			[this.data.statuses.THUNDER_III.id]: [],
		}
	}

	private pushApplication(targetKey: string, statusId: number, event: Events['statusApply'], clip?: number) {
		const target = this.tracker[targetKey] = this.tracker[targetKey] || this.createTargetApplicationList()
		const proc = this.lastThunderProc
		const source = this.lastThunderCast
		target[statusId].applications.push({event, clip, source, proc})
		this.lastThunderProc = false
	}

	private onDotCast(event: Events['action']) {
		this.thunder3Casts++
		if (this.procs.checkEventWasProc(event)) {
			this.lastThunderProc = true
		}
		this.lastThunderCast = event.action
	}

	private onDotApply(event: Events['statusApply']) {
		const statusId = event.status

		// Make sure we're tracking for this target
		const applicationKey = event.target
		const trackerInstance = this.tracker[applicationKey] = this.tracker[applicationKey] || {}

		// If it's not been applied yet, set it and skip out
		if (!trackerInstance[statusId]) {
			trackerInstance[statusId] = {
				lastApplication: event.timestamp,
				applications: [],
			}
			//save the application for later use in the output
			this.pushApplication(applicationKey, statusId, event)
			return
		}
		// Base clip calc
		let clip = this.STATUS_DURATION[statusId] - (event.timestamp - trackerInstance[statusId].lastApplication)
		clip = Math.max(0, clip)
		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this.clip[statusId] += clip
		//save the application for later use in the output
		this.pushApplication(applicationKey, statusId, event, clip)

		trackerInstance[statusId].lastApplication = event.timestamp
	}

	// Get the uptime percentage for the Thunder status debuff
	private getThunderUptime() {
		const statusTime = this.statuses.getUptime(this.data.statuses.THUNDER_III, this.actors.foes)
		const uptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusTime / uptime) * 100
	}

	private onComplete() {
		// Checklist item for keeping Thunder 3 DoT rolling
		this.checklist.add(new Rule({
			name: <Trans id="blm.thunder.checklist.dots.name">Keep your <DataLink status="THUNDER_III" /> DoT up</Trans>,
			description: <Trans id="blm.thunder.checklist.dots.description">
				Your <DataLink status="THUNDER_III" /> DoT contributes significantly to your overall damage, both on its own, and from additional <DataLink status="THUNDERCLOUD" /> procs. Try to keep the DoT applied.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="blm.thunder.checklist.dots.requirement.name"><DataLink status="THUNDER_III" /> uptime</Trans>,
					percent: () => this.getThunderUptime(),
				}),
			],
		}))

		// Suggestions to not spam T3 too much
		const sumClip = this.clip[this.data.statuses.THUNDER_III.id]
		const maxExpectedClip = (this.thunder3Casts - 1) * MAX_ALLOWED_T3_CLIPPING
		if (sumClip > maxExpectedClip) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.THUNDER_III.icon,
				content: <Trans id="blm.thunder.suggestions.excess-thunder.content">
					Casting <DataLink action="THUNDER_III" /> too frequently can cause you to lose DPS by casting fewer <DataLink action="FIRE_IV" />. Try not to cast <DataLink showIcon={false} action="THUNDER_III" /> unless your <DataLink status="THUNDER_III" /> DoT or <DataLink status="THUNDERCLOUD" /> proc are about to wear off.
					Check the <a href="#" onClick={e => { e.preventDefault(); this.parser.scrollTo(Thunder.handle) }}><NormalisedMessage message={Thunder.title}/></a> module for more information.
				</Trans>,
				severity: sumClip > 2 * maxExpectedClip ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Trans id="blm.thunder.suggestions.excess-thunder.why">
					Total DoT clipping exceeded the maximum clip time of {this.parser.formatDuration(maxExpectedClip)} by {this.parser.formatDuration(sumClip-maxExpectedClip)}.
				</Trans>,
			}))
		}
	}

	private createTargetStatusTable(target: ThunderTargetData) {
		let totalThunderClip = 0
		return	<Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><DataLink action="THUNDER_III" /> <Trans id="blm.thunder.applied">Applied</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.thunder.clip">Clip</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.thunder.total-clip">Total Clip</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.thunder.source">Source</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{target[this.data.statuses.THUNDER_III.id].applications.map(
					(event) => {
						const thisClip = event.clip || 0
						totalThunderClip += thisClip
						const action = this.data.getAction(event.source)
						let icon = <ActionLink showName={false} {...action} />
						//if we have a clip, overlay the proc.png over the actionlink image
						if (event.proc) {
							icon = <div className={styles.procOverlay}><ActionLink showName={false} {...action} /></div>
						}
						const renderClipTime = event.clip != null ? this.parser.formatDuration(event.clip) : '-'
						let clipSeverity: ReactNode = renderClipTime
						// Make it white for expected clipping, yellow if the GCD aligned poorly, and red if it was definitely clipped too hard
						if (thisClip > MAX_ALLOWED_T3_CLIPPING && thisClip <= MAX_ALLOWED_T3_CLIPPING + MAX_ALLOWED_BAD_GCD_THRESHOLD) {
							clipSeverity = <span className="text-warning">{clipSeverity}</span>
						}
						if (thisClip > MAX_ALLOWED_T3_CLIPPING + MAX_ALLOWED_BAD_GCD_THRESHOLD) {
							clipSeverity = <span className="text-error">{clipSeverity}</span>
						}
						return <Table.Row key={event.event.timestamp}>
							<Table.Cell>{this.parser.formatEpochTimestamp(event.event.timestamp)}</Table.Cell>
							<Table.Cell>{clipSeverity}</Table.Cell>
							<Table.Cell>{totalThunderClip ? this.parser.formatDuration(totalThunderClip) : '-'}</Table.Cell>
							<Table.Cell style={{textAlign: 'center'}}>{icon}</Table.Cell>
						</Table.Row>
					})}
			</Table.Body>
		</Table>

	}

	override output() {
		const numTargets = Object.keys(this.tracker).length

		const disclaimer = <Message>
			<Trans id="blm.thunder.clip-disclaimer">
				Due to the nature of <DataLink action="THUNDER_III" /> procs, you will run into situations where you will use your <DataLink status="THUNDERCLOUD" /> proc before it runs out, while your <DataLink status="THUNDER_III" /> is still running on your enemy.
				At most, this could theoretically lead to refreshing <DataLink showIcon={false} status="THUNDER_III" /> a maximum of ~3 seconds early every single refresh.
				Since this amount of clipping is still considered optimal, we quantify and call this the maximum clip time.
			</Trans>
		</Message>

		if (numTargets === 0) { return null }

		if (numTargets > 1) {
			const panels = Object.keys(this.tracker).map(applicationKey => {
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
				{disclaimer}
				<Accordion
					exclusive={false}
					panels={panels}
					styled
					fluid
				/>
			</>

		}

		return 	<>
			{disclaimer}
			{this.createTargetStatusTable(Object.values(this.tracker)[0])}
		</>
	}
}
