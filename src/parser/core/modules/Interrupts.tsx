import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import GlobalCooldown from 'parser/core/modules/GlobalCooldown'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import {Data} from './Data'

interface SeverityTiers {
	[key: number]: number
}

// used for timeline viewing by giving you a nice 30s window
const TIMELINE_UPPER_MOD: number = 30000

export abstract class Interrupts extends Module {
	static handle: string = 'interrupts'
	static title: MessageDescriptor = t('core.interrupts.title')`Interrupted Casts`

	@dependency private data!: Data
	@dependency private globalCooldown!: GlobalCooldown
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private currentCast?: CastEvent
	private droppedCasts: CastEvent[] = []
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
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible.
	</Trans>

	/**
	 * Implementing modules MAY override this function to provide specific text if they wish for the 'why'
	 * The default is to complain that they missed a number of casts and give them an estimate
	 * @param missedCasts The array of missed casts
	 * @param missedTime The approximate time wasted via interrupts
	 * @returns JSX that conforms to your suggestion content
	 */
	protected suggestionWhy(missedCasts: CastEvent[], missedTime: number): JSX.Element {
		return <Trans id="core.interrupts.suggestion.why">You missed { missedCasts.length } casts (approximately { this.parser.formatDuration(missedTime) } of total casting time) due to interruption.</Trans>
	}

	/**
	 * Implementing modules MAY override this function to provide alternative output if there's 0 interrupted
	 * casts (in lieu of an empty table)
	 */
	protected noInterruptsOutput(): JSX.Element | undefined {
		return undefined
	}

	protected init() {
		this.addEventHook('begincast', {by: 'player'}, this.onBeginCast)
		this.addEventHook('cast', {by: 'player'}, this.onCast)

		this.addEventHook('complete', this.onComplete)
	}

	private onBeginCast(event: CastEvent) {
		// if they started casting something, then cancel and start something else,
		// that's definitely an interrupted cast
		if (this.currentCast) {
			this.pushDropCasts(event)
		}
		this.currentCast = event
	}

	private onCast(event: CastEvent) {
		const guid = event.ability.guid
		// if the thing they started casting doesn't match up with what they cast, then
		// that's an interrupted cast. Also, ignore attacks, since those can apparently happy during
		// casting events..
		if (this.currentCast && guid !== this.currentCast.ability.guid && guid !== ACTIONS.ATTACK.id) {
			this.pushDropCasts(event)
		}
		this.currentCast = undefined
	}

	private pushDropCasts(event: CastEvent) {
		// we shouldn't hit this, since there has to be a valid event to compare to, but check just to be safe
		if (this.currentCast) {
			this.missedTimeMS += Math.min(this.globalCooldown.getEstimate(), event.timestamp - this.currentCast.timestamp)
			this.droppedCasts.push(this.currentCast)
		}
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

	output() {
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
				this.droppedCasts.map((cast) =>
					<Table.Row key={cast.timestamp}>
						<Table.Cell textAlign="center">
							<span style={{marginRight: 5}}>{this.parser.formatTimestamp(cast.timestamp)}</span>
							<Button
								circular
								compact
								size="mini"
								icon="time"
								onClick={() => this.timeline.show(cast.timestamp - this.parser.eventTimeOffset, cast.timestamp - this.parser.eventTimeOffset + TIMELINE_UPPER_MOD)}
							/>
						</Table.Cell>
						<Table.Cell>
							<ActionLink {...this.data.getAction(cast.ability.guid)} />
						</Table.Cell>
					</Table.Row>,
				)
			}
		</Table.Body>
	</Table>

	}
}
