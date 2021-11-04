import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {filter} from '../filter'
import {dependency} from '../Injectable'
import CastTime from './CastTime'
import {Data} from './Data'

interface SeverityTiers {
	[key: number]: number
}

// used for timeline viewing by giving you a nice 30s window
const TIMELINE_UPPER_MOD: number = 30000

export class Interrupts extends Analyser {
	static override handle: string = 'interrupts'
	static override title: MessageDescriptor = t('core.interrupts.title')`Interrupted Casts`
	static override debug: boolean = false

	@dependency private castTime!: CastTime
	@dependency protected data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private currentCast?: Events['prepare']
	private droppedCasts: Array<Events['interrupt']> = []
	private missedTimeMS: number = 0

	/**
	 * Implementing modules MAY override the icon to be used for the suggestion,
	 * though, let's face it – interject is pretty much the perfect one.
	 */
	protected icon: string = ACTIONS.INTERJECT.icon

	/**
	 * Implementing modules MAY override the severity tiers for interrupted casts
	 */
	protected severity: SeverityTiers = {
		2: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	}

	/**
	 * Implementing modules MAY override the default suggestion text
	 */
	protected suggestionContent: JSX.Element = <Trans id="core.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible. If you have to move, try to save an instant cast to keep your GCD rolling.
	</Trans>

	/**
	 * Implementing modules MAY override this function to provide specific text if they wish for the 'why'
	 * The default is to complain that they missed a number of casts and give them an estimate
	 * @param missedCasts The array of missed casts
	 * @param missedTime The approximate time wasted via interrupts
	 * @returns JSX that conforms to your suggestion content
	 */
	protected suggestionWhy(missedCasts: Array<Events['interrupt']>, missedTime: number): JSX.Element {
		return <Trans id="core.interrupts.suggestion.why">You missed { missedCasts.length } casts (approximately { this.parser.formatDuration(missedTime) } of total casting time) due to interruption.</Trans>
	}

	/**
	 * Implementing modules MAY override this function to provide alternative output if there's 0 interrupted
	 * casts (in lieu of an empty table)
	 */
	protected noInterruptsOutput(): JSX.Element | undefined {
		return undefined
	}

	public override initialise() {
		this.addEventHook(
			filter<Event>()
				.type('prepare')
				.source(this.parser.actor.id),
			this.onBeginCast
		)
		this.addEventHook(
			filter<Event>()
				.type('interrupt')
				.source(this.parser.actor.id),
			this.pushDropCasts
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onBeginCast(event: Events['prepare']) {
		this.currentCast = event
	}

	private pushDropCasts(event: Events['interrupt']) {
		if (this.currentCast == null) { return }

		const castTime = this.castTime.forAction(this.currentCast.action, this.currentCast.timestamp) ?? 0

		this.missedTimeMS += Math.min(
			event.timestamp - (this.currentCast?.timestamp ?? this.parser.currentEpochTimestamp),
			castTime
		)
		this.droppedCasts.push(event)
		this.currentCast = undefined
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.icon,
			tiers: this.severity,
			value: this.droppedCasts.length,
			content: this.suggestionContent,
			why: this.suggestionWhy(this.droppedCasts, this.missedTimeMS),
		}))
	}

	override output() {
		if (this.droppedCasts.length === 0) {
			return this.noInterruptsOutput()
		}

		return <Table compact unstackable celled collapsing>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.interrupts.table.time">Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.interrupts.table.cast">Cast</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					this.droppedCasts.map((cast) => {
						const action = this.data.getAction(cast.action)
						return <Table.Row key={cast.timestamp}>
							<Table.Cell textAlign="center">
								<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(cast.timestamp)}</span>
								<Button
									circular
									compact
									size="mini"
									icon="time"
									onClick={() => this.timeline.show(cast.timestamp - this.parser.pull.timestamp, cast.timestamp - this.parser.pull.timestamp + TIMELINE_UPPER_MOD)}
								/>
							</Table.Cell>
							<Table.Cell>
								<ActionLink {...action} />
							</Table.Cell>
						</Table.Row>
					})
				}
			</Table.Body>
		</Table>

	}
}
