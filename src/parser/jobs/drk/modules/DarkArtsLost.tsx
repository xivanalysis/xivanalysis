import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {Gauge} from 'parser/core/modules/Gauge'
import {Table} from 'semantic-ui-react'

const DARK_ARTS_SPENDERS: ActionKey[] = [
	'FLOOD_OF_SHADOW',
	'EDGE_OF_SHADOW',
]

const TBN: ActionKey[] = [
	'THE_BLACKEST_NIGHT',
]

interface LostDarkArts {
	timestamp: number,
	reason: MessageDescriptor
}

export class DarkArtsLost extends Gauge {
	static override handle = 'Missed Dark Arts'

	static override title = msg({id: 'drk.missed.dark.arts.title', message: 'Missed Dark Arts'})

	private darkArts = false
	private droppedTBNTimestamps: LostDarkArts[] = []
	private tbnUsageTimestamps: number[] = []

	private onRemoveBlackestNight(event: Events['statusRemove']) {
		if (event.remainingShield != null && event.remainingShield > 0) {
			this.droppedTBNTimestamps.push({timestamp: event.timestamp, reason: msg({id: 'drk.darkarts.lost.reason.shieldnobreak', message: 'Shield Did Not Break'})})
		} else {
			if (this.darkArts) {
				this.droppedTBNTimestamps.push({timestamp: event.timestamp, reason: msg({id: 'drk.darkarts.lost.reason.overwritten', message: 'Dark Arts Overwritten'})})
			}
			this.darkArts = true
		}
	}

	private onUseTBN(event: Events['action']) {
		this.tbnUsageTimestamps.push(event.timestamp)
	}

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.matchActionId(TBN)), this.onUseTBN)

		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.matchActionId(DARK_ARTS_SPENDERS)), () => this.darkArts = false)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		// Note: This approach misses the following chances to lose a Dark Arts:
		// 1. You press TBN, and then a secondary Dark Knight uses TBN on the same target
		// 2. You press TBN on another player, and that player's TBN does not pop (death/expiry/a second dark Knight using TBN on them/etc)
		// For #1, it doesn't seem reasonable to mark it 'against' the player, and for #2, there are
		// enough edge cases for minimal value that it seems fine to leave that for a future exercise.
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.BLACKEST_NIGHT.id), this.onRemoveBlackestNight)

	}

	protected override onDeath(event: Events['death']) {
		super.onDeath(event)
		if (this.darkArts) {
			this.droppedTBNTimestamps.push({timestamp: event.timestamp, reason: msg({id: 'drk.darkarts.lost.reason.death', message: 'Death'})})
		}
		this.darkArts = false
	}

	override output() {
		const darkArtsLostTable = <Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="drk.darkarts.lost.at">Dark Arts Lost Time</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="drk.darkarts.lost.reason">Reason</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.droppedTBNTimestamps
					.map((d, idx) => {
						return <Table.Row key={`darkartsloss-${idx}`}>
							<Table.Cell>{this.parser.formatEpochTimestamp(d.timestamp)}</Table.Cell>
							<Table.Cell><NormalisedMessage message={d.reason}/></Table.Cell>
						</Table.Row>
					})
				}
			</Table.Body>
		</Table>

		if (this.droppedTBNTimestamps.length === 0) {
			return false
		}

		return (
			<div>
				{darkArtsLostTable}
			</div>
		)
	}
}
