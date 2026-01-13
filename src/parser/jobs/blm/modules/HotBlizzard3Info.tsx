import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import {Fragment} from 'react'
import {Button, Icon, Message, Table} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {Gauge} from './Gauge'
import {Utilities} from './Utilities'

// used for timeline viewing by giving you a nice 30s window centered on the B3 cast
const TIMELINE_EITHER_SIDE: number = 15000

export class HotBlizzard3Info extends Analyser {
	static override handle = 'hotb3info'
	static override title = msg({id: 'blm.hotb3info.title', message: 'Hot Blizzard IIIs'})
	static override displayOrder = DISPLAY_ORDER.HOT_BLIZZARD_III

	@dependency private data!: Data
	@dependency private gauge!: Gauge
	@dependency private timeline!: Timeline
	@dependency private utilities!: Utilities

	private hotB3CastTimes: number[] = []

	override initialise(): void {
		// Skip this analysis before 7.2, since we had better DPS increases for our instant casts then...
		if (this.parser.patch.before('7.2')) { return }

		const blizzard3Filter = filter<Event>()
			.source(this.parser.actor.id)
			.action(this.data.actions.BLIZZARD_III.id)
		this.addEventHook(blizzard3Filter.type('action'), this.onBlizzardIII)
	}

	private onBlizzardIII(event: Events['action']) {
		const gaugeState = this.gauge.getGaugeState(event.timestamp - 1)
		if (gaugeState.astralFire > 0) {
			this.hotB3CastTimes.push(event.timestamp)
		}
	}

	override output() {
		if (this.hotB3CastTimes.length === 0) { return }

		return <Fragment>
			<Message icon>
				<Icon name="info" />
				<Message.Content>
					<Trans id="blm.hotb3info.header.content">
						<DataLink action="BLIZZARD_III" /> receives a damage penalty when cast in Astral Fire. You can avoid this by switching into Umbral Ice with <DataLink showIcon={false} action="TRANSPOSE" />,
						and skipping the long base cast time by making it instant cast with either <DataLink showIcon={false} action="SWIFTCAST" /> or <DataLink showIcon={false} action="TRIPLECAST" />.<br/><br/>
						This may not always be possible if you need the instant casts to resolve mechanics, but if a spare charge was available at the time it could have been used for some extra damage.
					</Trans>
				</Message.Content>
			</Message>
			<Table compact unstackable celled collapsing>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell collapsing>
							<Trans id="blm.hotb3info.table.time">Time</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<Trans id="blm.hotb3info.table.swiftcast"><DataLink action="SWIFTCAST" /> available?</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<Trans id="blm.hotb3info.table.triplecase"><DataLink action="TRIPLECAST" /> available?</Trans>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{
						this.hotB3CastTimes.map((castTime) => {
							const timelineTime = castTime - this.parser.pull.timestamp
							return <Table.Row key={castTime}>
								<Table.Cell textAlign="center">
									<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(castTime)}</span>
									<Button
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(timelineTime - TIMELINE_EITHER_SIDE, timelineTime + TIMELINE_EITHER_SIDE)}
									/>
								</Table.Cell>
								<Table.Cell textAlign="center">
									{
										this.generateInstantAvailableCellContent(castTime, this.data.actions.SWIFTCAST)
									}
								</Table.Cell>
								<Table.Cell textAlign="center">
									{
										this.generateInstantAvailableCellContent(castTime, this.data.actions.TRIPLECAST)
									}
								</Table.Cell>
							</Table.Row>
						})
					}
				</Table.Body>
			</Table>
		</Fragment>
	}

	private generateInstantAvailableCellContent(castTime: number, action: Action) {
		const available = this.utilities.usageAvailableAtTimestamp(action, castTime)
		return <>
			{
				available
					? <Icon name="checkmark" className="text-success" />
					: <Icon name="remove" className="text-error" />
			}
		</>
	}
}
