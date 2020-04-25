import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Accordion, Table} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {getDataBy} from 'data'

// Can never be too careful :blobsweat:
const STATUS_DURATION = {
	[STATUSES.THUNDER_III.id]: 24000,
}

export default class Thunder extends Module {
	static handle = 'thunder'
	static title = t('blm.thunder.title')`thunder`
	static dependencies = [
		'checklist',
		'enemies',
		'entityStatuses',
		'gauge',
		'invuln',
		'suggestions',
	]

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
		const source = this._lastThunderCast
		target[statusId].push({event, clip, source})
	}

	_onDotCast(event) {
			this._lastThunderCast = event.ability.guid
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])

		// Remove any untargetable time from the clip - often want to hardcast after an invuln phase, but refresh w/ 3D shortly after.
		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - STATUS_DURATION[statusId], event.timestamp)

		// Also remove invuln time in the future that casting later would just push thunder into
		// TODO: This relies on a full set of invuln data ahead of time. Can this be trusted?
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + STATUS_DURATION[statusId] + clip)
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
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

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
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		const maxThunders = Math.floor(uptime / THUNDERCLOUD_MILLIS)
		if (this.thunder3Casts > maxThunders) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.excess-thunder.content">
					Casting <ActionLink {...ACTIONS.THUNDER_III} /> too many times can cause you to lose DPS by casting fewer <ActionLink {...ACTIONS.FIRE_IV} />. Try not to cast <ActionLink showIcon={false} {...ACTIONS.THUNDER_III} /> unless your <StatusLink {...STATUSES.THUNDER_III} /> DoT or <StatusLink {...STATUSES.THUNDERCLOUD} /> proc are about to wear off.
				</Trans>,
				severity: this.thunder3Casts > 2 * maxThunders ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Trans id="blm.rotation-watchdog.suggestions.excess-thunder.why">
					At least <Plural value={this.thunder3Casts - maxThunders} one="# extra Thunder III was" other="# extra Thunder III were"/> cast.
				</Trans>,
			}))
		}
    }
    
	_createTargetStatusTable(target) {
		let totalThunderClip = 0
		return <Table collapsing unstackable style={{border: 'none'}}>
			<Table.Body>
				<Table.Row>
					<Table.Cell style={{padding: '0 0 0 1em', verticalAlign: 'top'}}>
						<Table collapsing unstackable>
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
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
											<Table.Cell>{event.clip !== null ? this.parser.formatDuration(event.clip) : '-'}</Table.Cell>
											<Table.Cell>{totalthunderClip ? this.parser.formatDuration(totalthunderClip) : '-'}</Table.Cell>
											<Table.Cell style={{textAlign: 'center'}}><ActionLink showName={false} {...action} /></Table.Cell>
										</Table.Row>
									})}
							</Table.Body>
						</Table>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table>
	}

	output() {
		const numTargets = Object.keys(this._application).length

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
			return <Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		}

		return this._createTargetStatusTable(Object.values(this._application)[0])
	}
}
