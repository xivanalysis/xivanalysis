import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Table} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// At the start of the fight, the standard opener currently clips
// the first tri-disaster so that the second one can benefit from
// raid buffs.  Assume that it must happen before 20s in.
const ALLOWED_CLIP_END_TIME = 20000

// Can never be too careful :blobsweat:
const STATUS_DURATION = {
	[STATUSES.BIO_III.id]: 30000,
	[STATUSES.MIASMA_III.id]: 30000,
}

// In ms
const CLIPPING_SEVERITY = {
	1000: SEVERITY.MINOR,
	10000: SEVERITY.MEDIUM,
	30000: SEVERITY.MAJOR,
}

export default class DoTs extends Module {
	static handle = 'dots'
	static title = t('smn.dots.title')`DoTs`
	static dependencies = [
		'checklist',
		'enemies',
		'gauge',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.BIO_III.id]: 0,
		[STATUSES.MIASMA_III.id]: 0,
	}
	_application = {
		[STATUSES.BIO_III.id]: [],
		[STATUSES.MIASMA_III.id]: [],
	}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [STATUSES.BIO_III.id, STATUSES.MIASMA_III.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (
			!lastApplication[statusId] ||
			this.gauge.isRushing() ||
			(event.timestamp - this.parser.fight.start_time) < ALLOWED_CLIP_END_TIME
		) {
			lastApplication[statusId] = event.timestamp
			//save the application for later use in the output
			this._application[statusId].push({event: event, clip: null})
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

		//save the application for later use in the output
		this._application[statusId].push({event: event, clip: clip})

		lastApplication[statusId] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for dot uptime
		let description = <></>
		if (this.parser.patch.before('5.08')) {
			description = <Trans id="smn.dots.checklist.description_505">
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from your Ruin spells and <ActionLink {...ACTIONS.FESTER} />, your primary stack spender. Aim to keep them up at all times.
			</Trans>
		} else {
			description = <Trans id="smn.dots.checklist.description">
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER} />, your primary stack spender. Aim to keep them up at all times.
			</Trans>
		}
		this.checklist.add(new Rule({
			name: <Trans id="smn.dots.checklist.name">Keep your DoTs up</Trans>,
			description: description,
			requirements: [
				new Requirement({
					name: <Trans id="smn.dots.checklist.requirement.bio-iii.name">
						<ActionLink {...ACTIONS.BIO_III} /> uptime
					</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.BIO_III.id),
				}),
				new Requirement({
					name: <Trans id="smn.dots.checklist.requirement.miasma-iii.name">
						<ActionLink {...ACTIONS.MIASMA_III} /> uptime
					</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.MIASMA_III.id),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TRI_DISASTER.icon,
			content: <Trans id="smn.dots.suggestions.clipping.content">
				Avoid refreshing DoTs significantly before their expiration, except when rushing during your opener or the end of the fight. Unnecessary refreshes risk overwriting buff snapshots, and increase the frequency you'll need to hardcast your DoTs.
			</Trans>,
			why: <Trans id="smn.dots.suggestions.clipping.why">
				{this.parser.formatDuration(this._clip[STATUSES.BIO_III.id])} of {STATUSES.BIO_III.name} and {this.parser.formatDuration(this._clip[STATUSES.MIASMA_III.id])} of {STATUSES.MIASMA_III.name} lost to early refreshes.
			</Trans>,
			tiers: CLIPPING_SEVERITY,
			value: maxClip,
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	output() {
		let totalBioClip = 0
		let totalMiasmaClip = 0
		return <Table collapsing unstackable style={{border: 'none'}}>
			<Table.Body>
				<Table.Row>
					<Table.Cell style={{padding: '0 1em 0 0'}}>
						<Table collapsing unstackable>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell><ActionLink {...ACTIONS.MIASMA_III} /> <Trans id="smn.dots.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.clip">Clip</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.total-clip">Total Clip</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{this._application[STATUSES.MIASMA_III.id].map(
									(event) => {
										totalMiasmaClip += event.clip
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
											<Table.Cell>{event.clip !== null ? this.parser.formatDuration(event.clip) : '-'}</Table.Cell>
											<Table.Cell>{totalMiasmaClip ? this.parser.formatDuration(totalMiasmaClip) : '-'}</Table.Cell>
										</Table.Row>
									})}
							</Table.Body>
						</Table>
					</Table.Cell>
					<Table.Cell style={{padding: '0 0 0 1em'}}>
						<Table collapsing unstackable>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell><ActionLink {...ACTIONS.BIO_III} /> <Trans id="smn.dots.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.clip">Clip</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.total-clip">Total Clip</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{this._application[STATUSES.BIO_III.id].map(
									(event) => {
										totalBioClip += event.clip
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
											<Table.Cell>{event.clip !== null ? this.parser.formatDuration(event.clip) : '-'}</Table.Cell>
											<Table.Cell>{totalBioClip ? this.parser.formatDuration(totalBioClip) : '-'}</Table.Cell>
										</Table.Row>
									})}
							</Table.Body>
						</Table>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table>
	}
}
