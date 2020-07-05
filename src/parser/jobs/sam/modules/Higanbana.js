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

const STATUS_DURATION = {
	[STATUSES.HIGANBANA.id]: 60000,
}

const CLIPPING_SEVERITY = {
	1000: SEVERITY.MINOR,
	30000: SEVERITY.MEDIUM,
	60000: SEVERITY.MAJOR,
}
export default class Higanbana extends Module {
	static handle = 'higanbana'
	static title = t('sam.higanbana.title')`Higanbana`
	static dependencies = [
		'checklist',
		'enemies',
		'entityStatuses',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.HIGANBANA.id]: 0,
	}
	_application = {}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',

			abilityId: [STATUSES.HIGANBANA.id],
		}
		this.addEventHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addEventHook('complete', this._onComplete)
	}

	_createTargetApplicationList() {
		return {
			[STATUSES.HIGANBANA.id]: [],
		}
	}

	_pushApplication(targetKey, statusId, event, clip) {
		const target = this._application[targetKey] = this._application[targetKey] || this._createTargetApplicationList()
		target[statusId].push({event, clip})
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (!lastApplication[statusId]) {
			lastApplication[statusId] = event.timestamp
			this._pushApplication(applicationKey, statusId, event, null)
			return
		}

		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])

		// Remove any untargetable time from the clip - often want to hardcast after an invuln phase, but refresh w/ 3D shortly after.
		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - STATUS_DURATION[statusId], event.timestamp)

		// Also remove invuln time in the future that casting later would just push dots into
		// TODO: This relies on a full set of invuln data ahead of time. Can this be trusted?
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + STATUS_DURATION[statusId] + clip)
		clip = Math.max(0, clip)

		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this._clip[statusId] += clip

		this._pushApplication(applicationKey, statusId, event, clip)

		lastApplication[statusId] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: <Trans id= "sam.higanbana.checklist.name"> Keep <ActionLink {...ACTIONS.HIGANBANA} /> up </Trans>,
			description: <Trans id="sam.higanbana.checklist.description">
			As a Samurai, <ActionLink {...ACTIONS.HIGANBANA} /> is a significant portion of your sustained damage, and is required to kept up for as much as possible, for the best damage output.
			</Trans>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id = "sam.higanbana.checklist.requirement"><ActionLink {...ACTIONS.HIGANBANA} /> uptime </Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.HIGANBANA.id),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HIGANBANA.icon,
			content: <Trans id="sam.higanbana.suggestion.content">
				Avoid refreshing <ActionLink {...ACTIONS.HIGANBANA} /> significantly before it expires.
			</Trans>,
			why: <Trans id="sam.higanbana.suggestion.why">
				{this.parser.formatDuration(this._clip[STATUSES.HIGANBANA.id])} of {STATUSES.HIGANBANA.name} lost to early refreshes.
			</Trans>,
			tiers: CLIPPING_SEVERITY,
			value: maxClip,
		}))
	}
	getDotUptimePercent(statusId) {
		const statusUptime = this.entityStatuses.getStatusUptime(statusId, this.enemies.getEntities())
		const fightDuration = this.parser.currentDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	_createTargetStatusTable(target) {
		let totalDotClip = 0
		return <Table collapsing unstackable style={{border: 'none'}}>
			<Table.Body>
				<Table.Row>
					<Table.Cell style={{padding: '0 1em 0 0', verticalAlign: 'top'}}>
						<Table collapsing unstackable>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell><ActionLink {...ACTIONS.HIGANBANA} /> <Trans id="sam.higanbana.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="sam.higanbana.clip">Clip</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="sam.higanbana.total-clip">Total Clip</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{target[STATUSES.HIGANBANA.id].map(
									(event) => {
										totalDotClip += event.clip
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
											<Table.Cell>{event.clip !== null ? this.parser.formatDuration(event.clip) : '-'}</Table.Cell>
											<Table.Cell>{totalDotClip ? this.parser.formatDuration(totalDotClip) : '-'}</Table.Cell>
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
