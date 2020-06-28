import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Accordion, Table, Message} from 'semantic-ui-react'
import NormalisedMessage from 'components/ui/NormalisedMessage'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {getDataBy} from 'data'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import styles from './wrapper.module.css'

// Can never be too careful :blobsweat:
const STATUS_DURATION = {
	[STATUSES.THUNDER_III.id]: STATUSES.THUNDER_III.duration * 1000,
	[STATUSES.THUNDERCLOUD.id]: STATUSES.THUNDERCLOUD.duration * 1000,
}

const MAX_ALLOWED_T3_CLIPPING = 6000

const MAX_ALLOWED_T3_CLIPPING_BAD_GCD_LINE_UP = 8000

export default class Thunder extends Module {
	static handle = 'thunder'
    static title = t('blm.thunder.title')`Thunder`
    static displayOrder = DISPLAY_ORDER.THUNDER
	static dependencies = [
		'checklist',
		'enemies',
		'entityStatuses',
		'invuln',
		'suggestions',
		'procs',
	]

    thunder3Casts = 0
    _lastThunderProc = undefined
    _lastThunderCast = undefined
	_lastApplication = {}
	_clip = {
		[STATUSES.THUNDER_III.id]: 0,
	}
	_application = {}

	constructor(...args) {
		super(...args)

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.THUNDER_III.id,
		}
		this.addEventHook('cast', castFilter, this._onDotCast)
		const statusFilter = {
			by: 'player',
			abilityId: STATUSES.THUNDER_III.id,
		}
		this.addEventHook(['applydebuff', 'refreshdebuff'], statusFilter, this._onDotApply)
		this.addEventHook('complete', this._onComplete)
	}

	_createTargetApplicationList() {
		return {
			[STATUSES.THUNDER_III.id]: [],
		}
	}

	_pushApplication(targetKey, statusId, event, clip) {
		const target = this._application[targetKey] = this._application[targetKey] || this._createTargetApplicationList()
		const proc = this._lastThunderProc
		const source = this._lastThunderCast
		target[statusId].push({event, clip, source, proc})
		this._lastThunderProc = false
	}

	_onDotCast(event) {
		if (event.ability.guid === ACTIONS.THUNDER_III.id) {
			this.thunder3Casts++
		}
		if (this.procs.checkProc(event, STATUSES.THUNDERCLOUD.id)) {
			this._lastThunderProc = true
		}
		this._lastThunderCast = event.ability.guid
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet, set it and skip out
		if (!lastApplication[statusId]) {
			lastApplication[statusId] = event.timestamp
			//save the application for later use in the output
			this._pushApplication(applicationKey, statusId, event, null)
			return
		}
		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])
		clip = Math.max(0, clip)
		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this._clip[statusId] += clip
		//save the application for later use in the output
		this._pushApplication(applicationKey, statusId, event, clip)

		lastApplication[statusId] = event.timestamp
	}

	// Get the uptime percentage for the Thunder status debuff
	getThunderUptime() {
		const statusTime = this.entityStatuses.getStatusUptime(STATUSES.THUNDER_III.id, this.enemies.getEntities())
		const uptime = this.parser.currentDuration - this.invuln.getInvulnerableUptime()
		return (statusTime / uptime) * 100
	}

	_onComplete() {
		// Checklist item for keeping Thunder 3 DoT rolling
		this.checklist.add(new Rule({
			name: <Trans id="blm.thunder.checklist.dots.name">Keep your <StatusLink {...STATUSES.THUNDER_III} /> DoT up</Trans>,
			description: <Trans id="blm.thunder.checklist.dots.description">
				Your <StatusLink {...STATUSES.THUNDER_III} /> DoT contributes significantly to your overall damage, both on its own, and from additional <StatusLink {...STATUSES.THUNDERCLOUD} /> procs. Try to keep the DoT applied.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="blm.thunder.checklist.dots.requirement.name"><StatusLink {...STATUSES.THUNDER_III} /> uptime</Trans>,
					percent: () => this.getThunderUptime(),
				}),
			],
		}))

		// Suggestions to not spam T3 too much
		const sumClip = this._clip[STATUSES.THUNDER_III.id]
		const maxExpectedClip = (this.thunder3Casts - 1) * MAX_ALLOWED_T3_CLIPPING
		if (sumClip > maxExpectedClip) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III.icon,
				content: <Trans id="blm.thunder.suggestions.excess-thunder.content">
					Casting <ActionLink {...ACTIONS.THUNDER_III} /> too frequently can cause you to lose DPS by casting fewer <ActionLink {...ACTIONS.FIRE_IV} />. Try not to cast <ActionLink showIcon={false} {...ACTIONS.THUNDER_III} /> unless your <StatusLink {...STATUSES.THUNDER_III} /> DoT or <StatusLink {...STATUSES.THUNDERCLOUD} /> proc are about to wear off.
					Check the <a href="#" onClick={e => { e.preventDefault(); this.parser.scrollTo(this.constructor.handle) }}><NormalisedMessage message={this.constructor.title}/></a> module for more information.
				</Trans>,
				severity: this.sumClip > 2 * maxExpectedClip ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Trans id="blm.thunder.suggestions.excess-thunder.why">
					Total DoT clipping exceeded the maximum clip time of {this.parser.formatDuration(maxExpectedClip)} by {this.parser.formatDuration(sumClip-maxExpectedClip)}.
				</Trans>,
			}))
		}
	}

	_createTargetStatusTable(target) {
		let totalThunderClip = 0
		return	<Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><ActionLink {...ACTIONS.THUNDER_III} /> <Trans id="blm.thunder.applied">Applied</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.thunder.clip">Clip</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.thunder.total-clip">Total Clip</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.thunder.source">Source</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{target[STATUSES.THUNDER_III.id].map(
					(event) => {
						totalThunderClip += event.clip
						const action = getDataBy(ACTIONS, 'id', event.source)
						let icon = <ActionLink showName={false} {...action} />
						//if we have a clip, overlay the proc.png over the actionlink image
						if (event.proc) {
							icon = <div className={styles.procOverlay}><ActionLink showName={false} {...action} /></div>
						}
						const renderClipTime = event.clip != null ? this.parser.formatDuration(event.clip) : '-'
						let clipSeverity = renderClipTime
						//make it white for sub 6s, yellow for 6-8s and red for >8s
						if (event.clip > MAX_ALLOWED_T3_CLIPPING && event.clip <= MAX_ALLOWED_T3_CLIPPING_BAD_GCD_LINE_UP) {
							clipSeverity = <span className="text-warning">{clipSeverity}</span>
						}
						if (event.clip > MAX_ALLOWED_T3_CLIPPING_BAD_GCD_LINE_UP) {
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

	output() {
		const numTargets = Object.keys(this._application).length

		const disclaimer = 	<Message>
			<Trans id="blm.thunder.clip-disclaimer">
									Due to the nature of <ActionLink {...ACTIONS.THUNDER_III}/> procs, you will run into situations where you will use your <StatusLink {...STATUSES.THUNDERCLOUD} /> proc before it runs out, while your <StatusLink {...STATUSES.THUNDER_III}/> is still running on your enemy.
									At most, this could theoretically lead to refreshing <StatusLink showIcon={false} {...STATUSES.THUNDER_III}/> a maximum of ~6 seconds early every single refresh.
									Since this amount of clipping is still considered optimal, we quantify and call this the maximum clip time.
			</Trans>
		</Message>

		if (numTargets === 0) { return null }

		if (numTargets > 1) {
			const panels = Object.keys(this._application).map(applicationKey => {
				const targetId = applicationKey.split('|')[0]
				const target = this.enemies.getEntity(targetId)
				return {
					key: applicationKey,
					title: {
						content: <>{target.name}</>,
					},
					content: {
						content: this._createTargetStatusTable(this._application[applicationKey]),
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
			{this._createTargetStatusTable(Object.values(this._application)[0])}
		</>
	}
}
