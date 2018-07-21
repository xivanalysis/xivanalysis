import React, {Fragment} from 'react'
import {Table} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Statuses that need to be up for Fester to do :ok_hand: damage
const FESTER_STATUSES = [
	STATUSES.BIO_III.id,
	STATUSES.MIASMA_III.id,
]

// Flow needs to be burnt before first use - 15s is optimal for first cast
const FIRST_FLOW_TIMESTAMP = 15000

export default class Aetherflow extends Module {
	static handle = 'aetherflow'
	static dependencies = [
		'aoe', // Ensure AoE runs cleanup before us
		'checklist',
		'cooldowns',
		'enemies',
		'gauge',
		'suggestions',
	]

	_badFesters = []
	_badPainflares = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.FESTER.id,
		}, this._onCastFester)
		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.PAINFLARE.id,
		}, this._onPainflareDamage)
		this.addHook('complete', this._onComplete)
	}

	_onCastFester(event) {
		// Make sure all festers have the required dots up for Festers
		const target = this.enemies.getEntity(event.targetID)
		const numStatuses = FESTER_STATUSES.filter(statusId => target.hasStatus(statusId)).length
		if (numStatuses !== FESTER_STATUSES.length) {
			this._badFesters.push(event)
		}
	}

	_onPainflareDamage(event) {
		// Only fault single target PFs _outside_ rushes.
		if (event.hits.length <= 1 && !this.gauge.isRushing()) {
			this._badPainflares.push(event)
		}
	}

	_onComplete() {
		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Fragment>Use <ActionLink {...ACTIONS.AETHERFLOW} /> effectively</Fragment>,
			description: 'SMN\'s entire kit revolves around the Aetherflow cooldown. Make sure you squeeze every possible use out of it that you can.',
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Fragment>,
					percent: (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW.id) / (this.parser.fightDuration - FIRST_FLOW_TIMESTAMP)) * 100,
				}),
			],
		}))

		// Suggestion for bad festers
		const numBadFesters = this._badFesters.length
		if (numBadFesters) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FESTER.icon,
				content: <Fragment>
					To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
				</Fragment>,
				severity: numBadFesters < 5? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{numBadFesters} cast{numBadFesters > 1 && 's'} of Fester on targets without both DoTs.
				</Fragment>,
			}))
		}

		const numBadPainflares = this._badPainflares.length
		if (numBadPainflares) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.PAINFLARE.icon,
				content: <Fragment>
					Avoid casting <ActionLink {...ACTIONS.PAINFLARE}/> on a single target unless rushing a <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>, as it deals less damage than <ActionLink {...ACTIONS.FESTER}/> per hit.
				</Fragment>,
				severity: numBadPainflares < 5? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{numBadPainflares} single-target cast{numBadPainflares > 1 && 's'} of Painflare.
				</Fragment>,
			}))
		}
	}

	output() {
		// Really not happy with this output, but nem wanted it.
		// Look into a better display somehow, hopefully integrate into timeline in some fashion.
		const casts = this.cooldowns.getCooldown(ACTIONS.AETHERFLOW.id).history
		let totalDrift = 0
		return <Table collapsing>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell>Cast Time</Table.HeaderCell>
					<Table.HeaderCell>Drift</Table.HeaderCell>
					<Table.HeaderCell>Total Drift</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{casts.map((cast, i) => {
					let drift = 0
					if (i > 0) {
						const prevCast = casts[i - 1]
						drift = cast.timestamp - (prevCast.timestamp + prevCast.length)
					}
					totalDrift += drift
					return <Table.Row key={cast.timestamp}>
						<Table.Cell>{this.parser.formatTimestamp(cast.timestamp)}</Table.Cell>
						<Table.Cell>{drift ? this.parser.formatDuration(drift) : '-'}</Table.Cell>
						<Table.Cell>{totalDrift ? this.parser.formatDuration(totalDrift) : '-'}</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
