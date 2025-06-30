import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {ActionLink} from 'components/ui/DbLink'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {Gauge} from 'parser/core/modules/Gauge'
import {Team} from 'report'
import {Accordion, Table} from 'semantic-ui-react'

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

export class TBNUsage extends Gauge {
	static override handle = 'The Blackest Night Usage'

	static override title = msg({id: 'drk.tbn.title', message: 'The Blackest Night Usage'})

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

		const friendlyTargets = this.parser.pull.actors
			.filter(actor => actor.team === Team.FRIEND)
			.map(actor => actor.id)

		friendlyTargets.forEach((id) => {
			this.addEventHook(
				filter<Event>()
					.source(id)
					.type('statusRemove')
					.status(this.data.statuses.BLACKEST_NIGHT.id), this.onRemoveBlackestNight)
		})

	}

	protected override onDeath(event: Events['death']) {
		super.onDeath(event)
		if (this.darkArts) {
			this.droppedTBNTimestamps.push({timestamp: event.timestamp, reason: msg({id: 'drk.darkarts.lost.reason.death', message: 'Death'})})
		}
		this.darkArts = false
	}

	override output() {
		let darkArtsLostTable = <Table collapsing unstackable>
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
			darkArtsLostTable = <></>
		}

		const tbnUsagePanel = {
			key: this.data.actions.THE_BLACKEST_NIGHT.id,
			title: {
				content: <><ActionLink key={0} {...this.data.actions.THE_BLACKEST_NIGHT} /> - {this.tbnUsageTimestamps.length} <Trans id="drk.tbn.uses.text">uses</Trans></>,
			},
			content: {
				content: <Table compact unstackable celled>
					<Table.Body>
						{
							this.tbnUsageTimestamps.map((timestamp) => {
								return <Table.Row key="0">
									<Table.Cell>
										<Trans id="drk.tbn.table.usage-row.text">Used at {this.parser.formatEpochTimestamp(timestamp)}
										</Trans>
									</Table.Cell>
								</Table.Row>
							})
						}
					</Table.Body>
				</Table>,
			},
		}

		return (
			<div>
				<Accordion
					exclusive={false}
					styled
					fluid
					panels={[tbnUsagePanel]}
				/>
				{darkArtsLostTable}
			</div>
		)
	}
}
