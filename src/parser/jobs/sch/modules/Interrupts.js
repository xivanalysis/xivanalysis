import React from 'react'
import {Table, Button} from 'semantic-ui-react'
import {Trans} from '@lingui/react'
import {t} from '@lingui/macro'

import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const TIMELINE_UPPER_MOD = 30000

const INTERRUPT_SEVERITY = {
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export default class Interrupts extends Module {
	static handle = 'interrupts'
	static title = t('sch.interrupts.title')`Interrupted Casts`

	static dependencies = [
		'timeline',
		'gcd',
		'suggestions',
	]

	_currentCast = null
	_droppedCasts = []
	_missedTimeMS = 0

	constructor(...args) {
		super(...args)

		this.addEventHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addEventHook('cast', {by: 'player'}, this._onCast)

		this.addEventHook('complete', this._onComplete)
	}

	_onBeginCast(event) {
		// if they started casting something, then cancel and start something else, that's definitely an interrupted cast
		if (this._currentCast) {
			this._pushDropCasts(event)
		}
		this._currentCast = event
	}

	_onCast(event) {
		const guid = event.ability.guid
		// if the thing they started casting doesn't match up with what they cast, that's an interrupted cast
		if (this._currentCast && guid !== this._currentCast.ability.guid) {
			this._pushDropCasts(event)
		}
		this._currentCast = null
	}

	_pushDropCasts(currentEvent) {
		this._missedTimeMS += Math.min(this.gcd.getEstimate(), currentEvent.timestamp - this._currentCast.timestamp)
		this._droppedCasts.push({
			action: getDataBy(ACTIONS, 'id', this._currentCast.ability.guid),
			timestamp: this._currentCast.timestamp,
		})
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.INTERJECT.icon,
			tiers: INTERRUPT_SEVERITY,
			value: this._droppedCasts.length,
			content: <Trans id="sch.interrupts.suggestion.content">If you can, try to preposition yourself so you don't have to move during mechanics as much as possible. Utilizing slidecasting will lower the need to use <ActionLink {...ACTIONS.SCH_RUIN_II}/> to instantly relocate or interrupt your current Broil III cast</Trans>,
			why: <Trans id="sch.interrupts.suggestion.why">You missed { this._droppedCasts.length } casts (approximately { this.parser.formatDuration(this._missedTimeMS) } of total casting time) due to interruption.</Trans>,
		}))
	}

	output() {
		return <Table compact unstackable celled>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="sch.interrupts.table.time">Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="sch.interrupts.table.cast">Cast</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					this._droppedCasts.map((cast) =>
						<Table.Row key={cast.timestamp}>
							<Table.Cell textAlign="center">
								<span style={{marginRight: 5}}>{this.parser.formatTimestamp(cast.timestamp)}</span>
								<Button
									circular
									compact
									size="mini"
									icon="time"
									onClick={() => this.timeline.show(cast.timestamp - this.parser.fight.start_time, cast.timestamp - this.parser.fight.start_time + TIMELINE_UPPER_MOD)}
								/>
							</Table.Cell>
							<Table.Cell>
								<ActionLink {...cast.action} />
							</Table.Cell>
						</Table.Row>,
					)
				}
			</Table.Body>
		</Table>
	}
}
