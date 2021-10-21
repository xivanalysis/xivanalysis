import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import React from 'react'
import {Accordion, Table} from 'semantic-ui-react'

export default class DoTs extends Module {
	static handle = 'dots'
	static title = t('smn.dots.title')`DoTs`
	static dependencies = [
		'actors',
		'checklist',
		'data',
		'invulnerability',
		'statuses',
	]

	_lastBioCast = undefined
	_lastMiasmaCast = undefined
	_application = {}

	constructor(...args) {
		super(...args)

		const castFilter = {
			by: 'player',
			abilityId: [ACTIONS.BIO_III.id, ACTIONS.MIASMA_III.id, ACTIONS.TRI_DISASTER.id, ACTIONS.BANE.id],
		}
		this.addEventHook('cast', castFilter, this._onDotCast)
		const statusFilter = {
			by: 'player',
			abilityId: [STATUSES.BIO_III.id, STATUSES.MIASMA_III.id],
		}
		this.addEventHook(['applydebuff', 'refreshdebuff'], statusFilter, this._onDotApply)
		this.addEventHook('complete', this._onComplete)
	}

	_createTargetApplicationList() {
		return {
			[STATUSES.BIO_III.id]: [],
			[STATUSES.MIASMA_III.id]: [],
		}
	}

	_pushApplication(targetKey, statusId, event) {
		const target = this._application[targetKey] = this._application[targetKey] || this._createTargetApplicationList()
		const source = (statusId === STATUSES.BIO_III.id) ? this._lastBioCast : this._lastMiasmaCast
		target[statusId].push({event, source})
	}

	_onDotCast(event) {
		// Casts are tracked separately due to the chance for the Miasma status to
		// not be applied before the Bio cast.  Without separate tracking, you can
		// end up with "Miasma III DoT applied by Bio III"
		if (event.ability.guid === ACTIONS.BIO_III.id) {
			this._lastBioCast = event.ability.guid
		} else if (event.ability.guid === ACTIONS.MIASMA_III.id) {
			this._lastMiasmaCast = event.ability.guid
		} else {
			this._lastBioCast = event.ability.guid
			this._lastMiasmaCast = event.ability.guid
		}
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = this.parser.getFflogsEventTargetActorId(event)
		//save the application for later use in the output
		this._pushApplication(applicationKey, statusId, event)
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
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.statuses.getUptime(this.data.getStatus(statusId), this.actors.foes,)
		const fightDuration = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

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
									<Table.HeaderCell><ActionLink {...ACTIONS.MIASMA_III} /> <Trans id="smn.dots.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.source">Source</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{target[STATUSES.MIASMA_III.id].map(
									(event) => {
										const action = getDataBy(ACTIONS, 'id', event.source)
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
											<Table.Cell style={{textAlign: 'center'}}><ActionLink showName={false} {...action} /></Table.Cell>
										</Table.Row>
									})}
							</Table.Body>
						</Table>
					</Table.Cell>
					<Table.Cell style={{padding: '0 0 0 1em', verticalAlign: 'top'}}>
						<Table collapsing unstackable>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell><ActionLink {...ACTIONS.BIO_III} /> <Trans id="smn.dots.applied">Applied</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="smn.dots.source">Source</Trans></Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{target[STATUSES.BIO_III.id].map(
									(event) => {
										const action = getDataBy(ACTIONS, 'id', event.source)
										return <Table.Row key={event.event.timestamp}>
											<Table.Cell>{this.parser.formatTimestamp(event.event.timestamp)}</Table.Cell>
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
				const target = this.actors.get(applicationKey)
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
