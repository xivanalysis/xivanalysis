import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import styles from 'components/ui/Procs/ProcOverlay.module.css'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Enemies from 'parser/core/modules/Enemies'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {ReactNode} from 'react'
import {Accordion, Table, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import Procs from './Procs'

const MAX_ALLOWED_T3_CLIPPING = 6000

const MAX_ALLOWED_T3_CLIPPING_BAD_GCD_LINE_UP = 8000

interface ThunderApplicationData {
	event: BuffEvent,
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

export class Thunder extends Module {
	static override handle = 'thunder'
	static override title = t('blm.thunder.title')`Thunder`
	static override displayOrder = DISPLAY_ORDER.THUNDER

	@dependency private checklist!: Checklist
	@dependency private enemies!: Enemies
	@dependency private entityStatuses!: EntityStatuses
	@dependency private invulnerability!: Invulnerability
	@dependency private suggestions!: Suggestions
	@dependency private procs!: Procs
	@dependency private data!: Data

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

	override init() {

		this.addEventHook('cast', {by: 'player', abilityId: this.data.actions.THUNDER_III.id}, this.onDotCast)
		this.addEventHook(['applydebuff', 'refreshdebuff'],
			{by: 'player', abilityId: this.data.statuses.THUNDER_III.id},
			this.onDotApply)
		this.addEventHook('complete', this.onComplete)
	}

	private createTargetApplicationList() {
		return {
			[this.data.statuses.THUNDER_III.id]: [],
		}
	}

	private pushApplication(targetKey: string, statusId: number, event: BuffEvent, clip?: number) {
		const target = this.tracker[targetKey] = this.tracker[targetKey] || this.createTargetApplicationList()
		const proc = this.lastThunderProc
		const source = this.lastThunderCast
		target[statusId].applications.push({event, clip, source, proc})
		this.lastThunderProc = false
	}

	private onDotCast(event: CastEvent) {
		if (event.ability.guid === this.data.actions.THUNDER_III.id) {
			this.thunder3Casts++
		}
		if (this.procs.checkFflogsEventWasProc(event)) {
			this.lastThunderProc = true
		}
		this.lastThunderCast = event.ability.guid
	}

	private onDotApply(event: BuffEvent) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
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
		const statusTime = this.entityStatuses.getStatusUptime(this.data.statuses.THUNDER_III.id, this.enemies.getEntities())
		const uptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusTime / uptime) * 100
	}

	private onComplete() {
		// Checklist item for keeping Thunder 3 DoT rolling
		this.checklist.add(new Rule({
			name: <Trans id="blm.thunder.checklist.dots.name">Keep your <StatusLink {...this.data.statuses.THUNDER_III} /> DoT up</Trans>,
			description: <Trans id="blm.thunder.checklist.dots.description">
				Your <StatusLink {...this.data.statuses.THUNDER_III} /> DoT contributes significantly to your overall damage, both on its own, and from additional <StatusLink {...this.data.statuses.THUNDERCLOUD} /> procs. Try to keep the DoT applied.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="blm.thunder.checklist.dots.requirement.name"><StatusLink {...this.data.statuses.THUNDER_III} /> uptime</Trans>,
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
					Casting <ActionLink {...this.data.actions.THUNDER_III} /> too frequently can cause you to lose DPS by casting fewer <ActionLink {...this.data.actions.FIRE_IV} />. Try not to cast <ActionLink showIcon={false} {...this.data.actions.THUNDER_III} /> unless your <StatusLink {...this.data.statuses.THUNDER_III} /> DoT or <StatusLink {...this.data.statuses.THUNDERCLOUD} /> proc are about to wear off.
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
					<Table.HeaderCell><ActionLink {...this.data.actions.THUNDER_III} /> <Trans id="blm.thunder.applied">Applied</Trans></Table.HeaderCell>
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
						//make it white for sub 6s, yellow for 6-8s and red for >8s
						if (thisClip > MAX_ALLOWED_T3_CLIPPING && thisClip <= MAX_ALLOWED_T3_CLIPPING_BAD_GCD_LINE_UP) {
							clipSeverity = <span className="text-warning">{clipSeverity}</span>
						}
						if (thisClip > MAX_ALLOWED_T3_CLIPPING_BAD_GCD_LINE_UP) {
							clipSeverity = <span className="text-error">{clipSeverity}</span>
						}
						return <Table.Row key={event.event.timestamp}>
							<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
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

		const disclaimer = 	<Message>
			<Trans id="blm.thunder.clip-disclaimer">
									Due to the nature of <ActionLink {...this.data.actions.THUNDER_III}/> procs, you will run into situations where you will use your <StatusLink {...this.data.statuses.THUNDERCLOUD} /> proc before it runs out, while your <StatusLink {...this.data.statuses.THUNDER_III}/> is still running on your enemy.
									At most, this could theoretically lead to refreshing <StatusLink showIcon={false} {...this.data.statuses.THUNDER_III}/> a maximum of ~6 seconds early every single refresh.
									Since this amount of clipping is still considered optimal, we quantify and call this the maximum clip time.
			</Trans>
		</Message>

		if (numTargets === 0) { return null }

		if (numTargets > 1) {
			const panels = Object.keys(this.tracker).map(applicationKey => {
				const targetId = applicationKey.split('|')[0]
				const target = this.enemies.getEntity(targetId)
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
