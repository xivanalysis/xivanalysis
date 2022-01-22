import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {TimestampHookArguments} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Downtime from 'parser/core/modules/Downtime'
import {Gauge, TimerGauge} from 'parser/core/modules/Gauge'
import React from 'react'
import {Table} from 'semantic-ui-react'
import {isSuccessfulHit} from 'utilities'

const DARKSIDE_MAX_DURATION = 60000
const DARKSIDE_EXTENSION_ACTIONS: ActionKey[] = [
	'FLOOD_OF_SHADOW',
	'EDGE_OF_SHADOW',
]
const DARKSIDE_EXTENSION_TIME = 30000
const APPLICATION_FORGIVENESS = 2500

interface DarksideDrop {
	timestamp: number,
	reason: MessageDescriptor
}

export class Darkside extends Gauge {
	static override handle = 'Darkside'

	static override title = t('drk.darkside.title')`Darkside`
	@dependency private checklist!: Checklist
	@dependency private downtime!: Downtime

	private darksideGauge = this.add(new TimerGauge({
		maximum: DARKSIDE_MAX_DURATION,
		onExpiration: this.onDarksideExpiration.bind(this),
	}))
	private darksideDrops: DarksideDrop[] = []

	override initialise() {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('damage')
				.cause(this.data.matchCauseAction(DARKSIDE_EXTENSION_ACTIONS)), (event) => {
				if (event.cause.type === 'action' && isSuccessfulHit(event)) {
					this.darksideGauge.extend(DARKSIDE_EXTENSION_TIME, false)
				}
			})
		this.addEventHook('complete', this.onComplete)
	}

	protected override onDeath(event: Events['death']) {
		super.onDeath(event)
		this.darksideDrops.push({timestamp: event.timestamp, reason: t('drk.darkside.drop.reason.death')`Death`})
	}

	private onDarksideExpiration(args: TimestampHookArguments) {
		this.darksideDrops.push({timestamp: args.timestamp, reason: t('drk.darkside.drop.reason.timeout')`Timeout`})
	}

	private onComplete() {
		this.darksideGauge.pause()

		const fightDowntimes = this.downtime.getDowntimeWindows()
		const adjustedFightDuration = this.parser.pull.duration - this.downtime.getDowntime()

		const requireDarksideStartedBy = this.parser.pull.timestamp + APPLICATION_FORGIVENESS
		const endOfPull = this.parser.currentEpochTimestamp
		const expiredDuration = this.darksideGauge.getExpirationTime(requireDarksideStartedBy, endOfPull, fightDowntimes, APPLICATION_FORGIVENESS)

		const uptime = ((adjustedFightDuration - expiredDuration) / adjustedFightDuration) * 100

		this.checklist.add(new Rule({
			name: <Trans id="drk.darkside.uptime.name">Keep Darkside up</Trans>,
			description: <Trans id="drk.darkside.uptime.why">
				Darkside is gained by using <DataLink action="EDGE_OF_SHADOW"/> or <DataLink action="FLOOD_OF_SHADOW"/> and provides you with a 10% damage increase.  As such, it is a significant part of a DRK's personal DPS.  Do your best not to let it drop, and recover it as quickly as possible if it does.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="drk.darkside.uptime">Darkside Uptime</Trans>,
					percent: () => uptime,
				}),
			],
			target: 99,
		}))
	}

	override output() {
		if (this.darksideDrops.length === 0) {
			return false
		}

		return (
			<Table collapsing unstackable>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="drk.darkside.drop.at">Dropped Time</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="drk.darkside.drop.reason">Reason</Trans></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this.darksideDrops
						.map((d, idx) => {
							return <Table.Row key={`darksidedrop-${idx}`}>
								<Table.Cell>{this.parser.formatEpochTimestamp(d.timestamp)}</Table.Cell>
								<Table.Cell><NormalisedMessage message={d.reason}/></Table.Cell>
							</Table.Row>
						})
					}
				</Table.Body>
			</Table>
		)
	}
}
