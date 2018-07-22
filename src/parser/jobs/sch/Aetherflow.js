import React, {Fragment} from 'react'
import {Table} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Flow needs to be burnt before first use - 15s is optimal for first cast
const FIRST_FLOW_TIMESTAMP = 10000

export default class Aetherflow extends Module {
	static handle = 'aetherflow'
	static dependencies = [
		'checklist',
		'cooldowns',
		'enemies',
		'suggestions',
	]

	constructor(...args) {
		super(...args)
		this.addHook('complete', this._onComplete)
	}

	_onComplete() {
		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Fragment>Use all <ActionLink {...ACTIONS.AETHERFLOW} /> stacks within a 45 second window.</Fragment>,
			description: `
				The level 68 trait, Quickened Aetherflow, reduces your Aetherflow cooldown by 5 seconds after using a single stack of aetherflow.
				Using all your stacks before the cooldown is up effectively reduces the cooldown from 60 to 45 seconds,
				which helps with mana management.
			`,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Fragment>,
					percent: (this.getQuickenedAetherflowOnCooldown() / (this.parser.fightDuration - FIRST_FLOW_TIMESTAMP)) * 100,
				}),
			],
		}))
	}

	getQuickenedAetherflowOnCooldown() {
		// We override this.cooldowns.getTimeOnCooldown for now to get an effective cd of 45 secs.
		const cd = this.cooldowns.getCooldown(ACTIONS.AETHERFLOW.id)
		const currentTimestamp = this.parser.currentTimestamp

		// Doesn't count time on CD outside the bounds of the current fight, it'll throw calcs off
		return cd.history.reduce(
			(time, status) => time + Math.min(45000, currentTimestamp - status.timestamp),
			cd.current? Math.min(cd.current.length, currentTimestamp - cd.current.timestamp) : 0
		)
	}

	output() {
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
						drift = cast.timestamp - (prevCast.timestamp + 45000)
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
