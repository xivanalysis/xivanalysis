import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import CoreDoTs from 'parser/core/modules/DoTs'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Accordion, Table} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// In seconds
const SEVERITIES = {
	CLIPPING: {
		6: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		12: SEVERITY.MAJOR,
	},
	UPTIME: {
		84: TARGET.WARN,
		94: TARGET.SUCCESS,
	},
}

export default class DoTs extends CoreDoTs {
	static handle = 'biolysis'
	static displayOrder = DISPLAY_ORDER.DOTS
	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'suggestions',
		'downtime',
	]

	static statusesToTrack = [
		STATUSES.BIOLYSIS.id,
	]

	_lastBioCast = undefined
	_application = {}

	constructor(...args) {
		super(...args)

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.BIOLYSIS.id,
		}
		this.addEventHook('cast', castFilter, this._onTrackedDotCast)
		const statusFilter = {
			by: 'player',
			abilityId: [STATUSES.BIOLYSIS.id],
		}
		this.addEventHook(['applydebuff', 'refreshdebuff'], statusFilter, this._onTrackedDotApply)
	}

	_createTargetApplicationList() {
		return {
			[STATUSES.BIOLYSIS.id]: [],
		}
	}

	_pushApplication(targetKey, statusId, event) {
		const target = this._application[targetKey] = this._application[targetKey] || this._createTargetApplicationList()
		const source = this._lastBioCast
		target[statusId].push({event, source})
	}

	_onTrackedDotCast(event) {
		this._lastBioCast = event.ability.guid
	}

	_onTrackedDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		//save the application for later use in the output
		this._pushApplication(applicationKey, statusId, event)
	}

	_createTargetStatusTable(target) {
		return <Table collapsing unstackable style={{border: 'none'}}>
			<Table.Body>
				<Table.Row>
					<Table.Cell style={{padding: '0 1em 0 0', verticalAlign: 'top'}}>
						<Table collapsing unstackable>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell><ActionLink {...ACTIONS.BIOLYSIS} /> <Trans id="sch.dots.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="sch.dots.source">Drift</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{target[STATUSES.BIOLYSIS.id].map(
									(event, index, array) => {
										const timestamp = event.event.timestamp
										let drift = 0
										if (index !== 0) {
											const previous = array[index-1].event.timestamp
											const delta =  timestamp - previous
											drift = delta - (STATUSES.BIOLYSIS.duration * 1000)
											if (drift > (STATUSES.BIOLYSIS.duration * 1000)) {
												const windows = this.downtime.getDowntimeWindows(timestamp - (STATUSES.BIOLYSIS.duration * 1000))
												if (windows.length > 0) {
													drift = 0
												}
											}
										} else {
											drift = 0
										}

										let earlyorlate = ' early'
										if (drift > 0) {
											earlyorlate = ' late'
										} else if (drift === 0) {
											earlyorlate = 'application'
										}
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(timestamp)}</Table.Cell>
											<Table.Cell style={{textAlign: 'center'}}>{
												drift !== 0 ? this.parser.formatDuration(Math.abs(drift)) : ''
											}{earlyorlate}</Table.Cell>
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
	}

	addChecklistRules() {
		this.checklist.add(new TieredRule({
			name: <Trans id="sch.dots.checklist.name">Keep your DoT up</Trans>,
			description: <Trans id="sch.dots.checklist.description">
				As a Scholar, Biolysis is a notable portion of your damage. Aim to keep it up as much as possible, so long as you can get at least 15 seconds of uptime per application.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="sch.dots.checklist.requirement.bio-ii.name"><ActionLink {...ACTIONS.BIOLYSIS} /> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.BIOLYSIS.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip) {
		const clipPerMinute = this.getClippingAmount(STATUSES.BIOLYSIS.id)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BIOLYSIS.icon,
			content: <Trans id="sch.dots.suggestions.clipping.content">
				Avoid refreshing Biolysis significantly before its expiration, except when at the end of the fight. Unnecessary refreshes use up your mana more than necessary, and may cause you to go out of mana.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: clipPerMinute,
			why: <Trans id="sch.dots.suggestions.clipping.why">
				An average of {this.parser.formatDuration(clipPerMinute * 1000)} of <StatusLink {...STATUSES.BIOLYSIS}/> clipped every minute, for a total of {this.parser.formatDuration(clip[STATUSES.BIOLYSIS.id] ?? 0)} lost to early refreshes.
			</Trans>,
		}))
	}
}

