import React, {Fragment} from 'react'
import {Table} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Statuses that need to be up for Fester & Bane to actually do something good
const SMN_DOT_STATUSES = [
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

	_badBanes = []			// In case we ever want to check for Banes where 1 or 0 DoTs are spread
	_reallyBadBanes = [] 	// DoTless Bane...
	_badFesters = []		// 1 DoT Fester. Oh no, it gets worse!
	_reallyBadFesters = [] 	// 0 DoT Fester. :r333333:
	_badPainflares = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.BANE.id,
		}, this._onCastSmnBane)
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.FESTER.id,
		}, this._onCastSmnFester)
		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.PAINFLARE.id,
		}, this._onPainflareDamage)
		this.addHook('complete', this._onComplete)
	}

	// Separation of Bane and Fester for arrays, hope this is ok
	_onCastSmnBane(event) {
		// Make sure all Banes have the required dots up
		const target = this.enemies.getEntity(event.targetID)
		const numStatuses = SMN_DOT_STATUSES.filter(statusId => target.hasStatus(statusId)).length

		// Differentiates between partial (bad) or total (really bad) whiffs
		if (numStatuses === 1) {
			this._badBanes.push(event)
		}

		if (numStatuses === 0) {
			this._reallyBadBanes.push(event)
		}
	}

	_onCastSmnFester(event) {
		// Make sure all Festers have the required dots up
		const target = this.enemies.getEntity(event.targetID)
		const numStatuses = SMN_DOT_STATUSES.filter(statusId => target.hasStatus(statusId)).length

		// Differentiates between partial (bad) or total (really bad) whiffs
		if (numStatuses === 1) {
			this._badFesters.push(event)
		}

		if (numStatuses === 0) {
			this._reallyBadFesters.push(event)
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

		// Suggestion for bad & really bad festers, also sorry for being bad and not knowing how to better structure
		const numBadFesters = this._badFesters.length
		const numReallyBadFesters = this._reallyBadFesters.length
		// Feel this can be used as a better base metric for judging Fester whiff severity, imo < 600 is medium, > major
		const totalFesterPotencyLost = (numBadFesters * 150 + numReallyBadFesters * 300)

		// Adjust Fester reason and severity based on frequency and types of bad Fester casts
		const reasonList = []
		if (numBadFesters > 0) {
			reasonList.push(`${numBadFesters} cast${numReallyBadFesters === 1 ? '' : 's'} of Fester on targets with 1 DoT`)
		}
		if (numReallyBadFesters > 0) {
			reasonList.push(`${numReallyBadFesters} cast${numReallyBadFesters === 1 ? '' : 's'} of Fester on targets with no DoTs`)
		}
		const reasonString = reasonList.join(' & ') + '.'

		if (numBadFesters || numReallyBadFesters) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FESTER.icon,
				content: <Fragment>
					To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
				</Fragment>,
				severity: totalFesterPotencyLost < 600 ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: reasonString,
			}))
		}

		// Painflare suggestion, I want to say < 4 is medium because 4 is greater than a Deathflare
		const numBadPainflares = this._badPainflares.length
		if (numBadPainflares) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.PAINFLARE.icon,
				content: <Fragment>
					Avoid casting <ActionLink {...ACTIONS.PAINFLARE}/> on a single target unless rushing a <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>, as it deals less damage than <ActionLink {...ACTIONS.FESTER}/> per hit.
				</Fragment>,
				severity: numBadPainflares < 4? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{numBadPainflares} single-target cast{numBadPainflares > 1 && 's'} of Painflare.
				</Fragment>,
			}))
		}
	}

	// Suggestion section for Bane for later. Tricky to deal with, but there's bane seeds for spreads
	// However one good one to evaluate is single target banes (with the above included?)

	output() {
		// Really not happy with this output, but nem wanted it. (Nem: I appreciate a ton for now, we'll work it out)
		// Look into a better display somehow, hopefully integrate into timeline in some fashion.
		const casts = this.cooldowns.getCooldown(ACTIONS.AETHERFLOW.id).history
		let totalDrift = 0
		return <Table collapsing unstackable>
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
