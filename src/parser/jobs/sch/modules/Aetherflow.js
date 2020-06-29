import React, {Fragment} from 'react'
import {Table, Grid} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// Actions that reduce Aetherflow's cooldown.
const AETHERFLOW_CD_ACTIONS = [
	ACTIONS.LUSTRATE.id,
	ACTIONS.EXCOGITATION.id,
	ACTIONS.INDOMITABILITY.id,
	ACTIONS.SACRED_SOIL.id,
	ACTIONS.SCH_ENERGY_DRAIN.id,
]

const RECITATION_ACTIONS = [
	ACTIONS.EXCOGITATION.id,
	ACTIONS.INDOMITABILITY.id,
	ACTIONS.ADLOQUIUM.id,
	ACTIONS.SUCCOR.id,
]

// Since we can't use Aetherflow pre-pull, is this relevant anymore?
const EXTRA_AETHERFLOWS = 3

const AETHERFLOW_COOLDOWN = 60000

// Flow needs to be burnt before first use - estimate at 10s for now
const FIRST_FLOW_TIMESTAMP = 10000

export default class Aetherflow extends Module {
	static displayOrder = DISPLAY_ORDER.AETHERFLOW
	static handle = 'aetherflow'
	static dependencies = [
		'checklist',
		'cooldowns',
	]

	_totalAetherflowCasts = 0
	_extraAetherflows = EXTRA_AETHERFLOWS // pre-pull
	_recitationActive = false
	_uses = []

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.RECITATION.id}, this._onGainRecitation)
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.RECITATION.id}, this._removeRecitation)
		this.addEventHook('death', {to: 'player'}, this._removeRecitation)
		this.addEventHook('complete', this._onComplete)
	}

	_onGainRecitation() {
		this._recitationActive = true
	}

	_removeRecitation() {
		this._recitationActive = false
	}

	_durationWithAetherflowOnCooldown() {
		return this.parser.currentDuration - FIRST_FLOW_TIMESTAMP
	}

	_possibleAetherflowCasts() {
		return this._extraAetherflows + Math.floor(this._durationWithAetherflowOnCooldown() / AETHERFLOW_COOLDOWN) * EXTRA_AETHERFLOWS
	}

	_updateAetherflowUses(ts, id) {
		this._totalAetherflowCasts++
		this._uses.push({timestamp: ts, debit: 1, id: [id]})
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (AETHERFLOW_CD_ACTIONS.includes(abilityId)) {
			// should be the standard case
			if (!this._recitationActive) {
				this._updateAetherflowUses(event.timestamp, abilityId)
			} else if (!RECITATION_ACTIONS.includes(abilityId)) {
				this._updateAetherflowUses(event.timestamp, abilityId)
			}
		}

		if (abilityId === ACTIONS.DISSIPATION.id) {
			this._extraAetherflows += EXTRA_AETHERFLOWS
		}
	}

	_onComplete() {
		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Fragment><Trans id="sch.aetherflow.checklist.name">Use <ActionLink {...ACTIONS.AETHERFLOW} /> on cooldown.</Trans></Fragment>,
			description: <ul>
				<li><Trans id="sch.aetherflow.checklist.description-1">Using aetherflow on cooldown lets you regain mana faster.</Trans></li>
			</ul>,
			requirements: [
				new Requirement({
					name: <Fragment><Trans id="sch.aetherflow.checklist.requirement.uptime.name"><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Trans></Fragment>,
					percent: (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW.id) / this._durationWithAetherflowOnCooldown()) * 100,
				}),
				new Requirement({
					name: <Fragment><Trans id="sch.aetherflow.checklist.requirement.uses.name">Total <ActionLink {...ACTIONS.AETHERFLOW} /> casts: {this._totalAetherflowCasts} out of {this._possibleAetherflowCasts()} possible</Trans></Fragment>,
					percent: this._totalAetherflowCasts / this._possibleAetherflowCasts() * 100,
				}),
			],
		}))
	}

	output() {
		const aetherflows = this.cooldowns.getCooldown(ACTIONS.AETHERFLOW.id).history
			.map(h => ({timestamp: [h.timestamp], id: [ACTIONS.AETHERFLOW.id]}))
		const dissipations = this.cooldowns.getCooldown(ACTIONS.DISSIPATION.id).history
			.map(h => ({timestamp: [h.timestamp], id: [ACTIONS.DISSIPATION.id]}))
		const uses = this._uses

		let totalDrift = 0
		let totalWasted = 0

		return <Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="sch.aetherflow.cast-time">Cast Times</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.cooldown">CD</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.drift">Drift</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.abilities-used">Abilities Used</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.stacks-wasted">Stacks Wasted</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{[].concat(aetherflows, dissipations, uses)
					.sort((a, b) => a.timestamp - b.timestamp)
					.reduce((prev, curr) => {
						if (prev.length === 0) {
							return [curr]
						}

						// group debits together
						const {id, debit, timestamp} = prev[prev.length-1]
						if (curr.debit) {
							prev[prev.length-1] = {
								debit: (debit || 0) + curr.debit,
								id: [].concat(id, curr.id),
								timestamp: [].concat(timestamp, curr.timestamp),
							}
							return prev
						}

						// not a debit, so it has to be a credit - insert a new item
						return [...prev, curr]
					}, [])
					.map(({timestamp, debit = 0, id}, index, all) => {
						let downtime = 0
						let drift = 0
						if (id.includes(ACTIONS.AETHERFLOW.id)) {
							let nextUptime

							// next credit is an aetherflow, calculate downtime now
							const nextCredit = all[index + 1]
							// if not, next next credit (due to dissipation)
							const nextNextCredit = all[index + 2]
							// if not, just consider it the end of fight.
							if (nextCredit && nextCredit.id[0] === ACTIONS.AETHERFLOW.id) {
								nextUptime = nextCredit.timestamp[0]
							} else if (nextNextCredit && nextNextCredit.id[0] === ACTIONS.AETHERFLOW.id) {
								nextUptime = nextNextCredit.timestamp[0]
								drift += EXTRA_AETHERFLOWS * 1000
							} else {
								nextUptime = this.parser.currentTimestamp
							}

							downtime = nextUptime - timestamp[0]
						}
						drift += downtime
						drift -= AETHERFLOW_COOLDOWN
						if (drift > 0) {
							totalDrift += drift
						}
						let wasted = 0
						if (downtime > AETHERFLOW_COOLDOWN) {
							wasted = EXTRA_AETHERFLOWS - debit || 0
							totalWasted += wasted
						}

						if (!Array.isArray(timestamp)) {
							// I mean, they should be doing more than one AF cast per stack
							// but who am I to judge?
							timestamp = [timestamp]
						}

						return <Table.Row key={timestamp}>
							<Table.Cell>{timestamp.map(t => this.parser.formatTimestamp(t)).join(', ')}</Table.Cell>
							<Table.Cell>{downtime > 0 && this.parser.formatDuration(downtime)}</Table.Cell>
							<Table.Cell>{drift > 0 && this.parser.formatDuration(drift)}</Table.Cell>
							<Table.Cell>
								<Grid>
									{id.map((id, i) => <Grid.Column key={i} width={4}>
										<ActionLink {...getDataBy(ACTIONS, 'id', id)} />
									</Grid.Column>)}
								</Grid>
							</Table.Cell>
							<Table.Cell>{wasted || '-'}</Table.Cell>
						</Table.Row>
					},
					)}
				<Table.Row>
					<Table.Cell colSpan="2" textAlign="right" col>Total Drift</Table.Cell>
					<Table.Cell>{this.parser.formatDuration(totalDrift)}</Table.Cell>
					<Table.Cell textAlign="right">Total Stacks Wasted</Table.Cell>
					<Table.Cell>{totalWasted || '-'}</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table>
	}
}
