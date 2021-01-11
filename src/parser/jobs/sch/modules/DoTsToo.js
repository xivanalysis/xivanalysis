import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import React from 'react'
import {Accordion, Table} from 'semantic-ui-react'

export default class DoTsToo extends Module {
	static handle = 'dots'
	static title = t('smn.dots.title')`DoTs`
	static dependencies = [
		'checklist',
		'enemies',
		'entityStatuses',
		'invuln',
	]

	_lastBioCast = undefined
	_application = {}

	constructor(...args) {
		super(...args)

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.BIOLYSIS.id,
		}
		this.addEventHook('cast', castFilter, this._onDotCast)
		const statusFilter = {
			by: 'player',
			abilityId: [STATUSES.BIOLYSIS.id],
		}
		this.addEventHook(['applydebuff', 'refreshdebuff'], statusFilter, this._onDotApply)
		// this.addEventHook('complete', this._onComplete)
	}

	_createTargetApplicationList() {
		return {
			[STATUSES.BIOLYSIS.id]: [],
		}
	}

	_pushApplication(targetKey, statusId, event) {
		const target = this._application[targetKey] = this._application[targetKey] || this._createTargetApplicationList()
		// const source = (statusId === STATUSES.BIO_III.id) ? this._lastBioCast : this._lastMiasmaCast
		const source = this._lastBioCast
		target[statusId].push({event, source})
	}

	_onDotCast(event) {
		// Casts are tracked separately due to the chance for the Miasma status to
		// not be applied before the Bio cast.  Without separate tracking, you can
		// end up with "Miasma III DoT applied by Bio III"
		// if (event.ability.guid === ACTIONS.BIO_III.id) {
		// 	this._lastBioCast = event.ability.guid
		// } else if (event.ability.guid === ACTIONS.MIASMA_III.id) {
		// 	this._lastMiasmaCast = event.ability.guid
		// } else {
		// 	this._lastBioCast = event.ability.guid
		// 	this._lastMiasmaCast = event.ability.guid
		// }
		this._lastBioCast = event.ability.guid
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		//save the application for later use in the output
		this._pushApplication(applicationKey, statusId, event)
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.entityStatuses.getStatusUptime(statusId, this.enemies.getEntities())
		const fightDuration = this.parser.currentDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	_createTargetStatusTable(target) {
		return <Table collapsing unstackable style={{border: 'none'}}>
			<Table.Body>
				<Table.Row>
					<Table.Cell style={{padding: '0 1em 0 0', verticalAlign: 'top'}}>
						<Table collapsing unstackable>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell><ActionLink {...ACTIONS.BIOLYSIS} /> <Trans id="smn.dots.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.source">Drift</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{target[STATUSES.BIOLYSIS.id].map(
									(event, index, array) => {
										const timestamp = event.event.timestamp
										let drift = 0
										if (index != 0) {
											const previous = array[index-1].event.timestamp
											const delta =  timestamp - previous
											drift = delta - (STATUSES.BIOLYSIS.duration * 1000)
											console.log(this.parser.formatTimestamp(timestamp) + ' - ' + this.parser.formatTimestamp(previous) + ' = ' + this.parser.formatDuration(drift))
										} else {
											drift = 0
										}

										let earlyorlate = ' early'
										if (drift > 0) {
											earlyorlate = ' late'
										}
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(timestamp)}</Table.Cell>
											<Table.Cell style={{textAlign: 'center'}}>{this.parser.formatDuration(drift)}{earlyorlate}</Table.Cell>
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
