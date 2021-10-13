import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Button, Table} from 'semantic-ui-react'

interface EngDisTracking {
	manaficationUsed: boolean
	start: number,
	end: number,
	actions: Array<Events['execute']>
}

export class EngagementDisplacementTracking extends Analyser {
	static override handle: string = 'engdistrack'
	static override title: MessageDescriptor = t('rdm.engdistrack.title')`Engagement/Displacement Tracking`
	static override debug: boolean = false

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private windows: EngDisTracking[] = [{
		manaficationUsed: false,
		start: this.parser.pull.timestamp,
		end: -1,
		actions: [],
	}]

	public override initialise() {
		const userFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(
			userFilter
				.action(this.data.matchActionId(['ENGAGEMENT', 'DISPLACEMENT']))
				.type('execute'),
			this.onCast
		)
		this.addEventHook(
			userFilter.action(this.data.actions.MANAFICATION.id),
			this.onManification
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['execute']) {
		this.debug(this.data.getAction(event.action)?.name ?? 'Unknown – Please Investigate', `at ${this.parser.formatEpochTimestamp(event.timestamp)}`)
		this.windows[this.windows.length-1].actions.push(event)
	}

	private onManification(event: Events['action']) {
		this.debug(`Manification used at ${this.parser.formatEpochTimestamp(event.timestamp)}`)
		// clean up old window
		this.windows[this.windows.length-1].end = event.timestamp
		this.debug('Outgoing window actions:', this.windows[this.windows.length-1])
		this.windows.push({
			start: event.timestamp,
			end: -1,
			actions: [],
			manaficationUsed: true,
		})
	}

	private onComplete() {
		// clean up last window
		this.windows[this.windows.length-1].end = this.parser.pull.timestamp + this.parser.pull.duration
		this.debug(this.windows)
	}

	override output(): ReactNode {
		return <Table compact unstackable celled collapsing>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="rdm.engdistracking.windowTitle">Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="rdm.engdistracking.windowActions">Engagement / Displacement Actions</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					// filter out windows that have no actions with no manification, then do our map
					this.windows
						.filter(window => window.actions.length >= 0)
						.map(window => {
							return <Table.Row key={window.start}>
								<Table.Cell textAlign="center">
									<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(window.start)}</span>
									<Button
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(window.start - this.parser.pull.timestamp, window.end - this.parser.pull.timestamp)}
									/>
								</Table.Cell>
								<Table.Cell>
									{window.actions.map(action =>
										<ActionLink key={action.timestamp} {...this.data.getAction(action.action)} showName={false} />
									)}
								</Table.Cell>
							</Table.Row>
						})
				}
			</Table.Body>
		</Table>
	}
}
