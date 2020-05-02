import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Table, Button} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {SimpleRow, StatusItem} from 'parser/core/modules/Timeline'

const LL_BUFFS = [
	STATUSES.LEY_LINES.id,
	STATUSES.CIRCLE_OF_POWER.id,
]

export default class Leylines extends Module {
	static handle = 'leylines'
	static title = t('blm.leylines.title')`Ley Lines`
	static displayOrder = DISPLAY_ORDER.LEY_LINES

	static dependencies = [
		'checklist',
		'timeline',
	]

	_buffWindows = {
		[STATUSES.LEY_LINES.id]: {
			current: null,
			history: [],
		},
		[STATUSES.CIRCLE_OF_POWER.id]: {
			current: null,
			history: [],
		},
	}

	constructor(...args) {
		super(...args)

		this.addEventHook('applybuff', {by: 'player', abilityId: LL_BUFFS}, this._onGain)
		this.addEventHook('removebuff', {by: 'player', abilityId: LL_BUFFS}, this._onDrop)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	// Manage buff windows
	_onGain(event) {
		const status = getDataBy(STATUSES, 'id', event.ability.guid)

		// Something is not right
		if (!status) {
			return
		}

		// Track the new window
		const tracker = this._buffWindows[status.id]
		tracker.current = {
			start: event.timestamp,
		}
	}

	_onDrop(event) {
		this._stopAndSave(event.ability.guid, event.timestamp)
	}

	// We died, close windows
	_onDeath(event) {
		this._stopAndSave(STATUSES.LEY_LINES.id, event.timestamp)
	}

	// Finalise a buff window
	_stopAndSave(statusId, endTime = this.parser.currentTimestamp) {
		const tracker = this._buffWindows[statusId]

		// Already closed, nothing to do here
		if (!tracker.current) {
			return
		}

		// Close the window
		tracker.current.stop = endTime
		tracker.history.push(tracker.current)
		tracker.current = null

		// Close dependency windows
		if (statusId === STATUSES.LEY_LINES.id) {
			this._stopAndSave(STATUSES.CIRCLE_OF_POWER.id, endTime)
		}
	}

	// A reminder of man's ability to generate electricity
	_dontMovePercent(power, lines) {
		return (power / lines) * 100
	}

	_onComplete() {
		// Current time will be end of fight so no need to pass it here
		if (this._buffWindows[STATUSES.LEY_LINES.id].current) {
			this._stopAndSave(STATUSES.LEY_LINES.id)
		}

		// Build the grouping row
		const parentRow = this.timeline.addRow(new SimpleRow({
			label: 'Ley Lines Buffs',
			order: 0,
		}))

		// For each buff, add it to timeline
		LL_BUFFS.forEach(buff => {
			const status = getDataBy(STATUSES, 'id', buff)

			const row = parentRow.addRow(new SimpleRow({label: status.name}))

			const fightStart = this.parser.fight.start_time

			this._buffWindows[buff].history.forEach(window => {
				row.addItem(new StatusItem({
					status,
					start: window.start - fightStart,
					end: window.stop - fightStart,
				}))
			})
		})

		// Get the total duration of CoP uptime and Ley Lines, so we can get the overall percentage uptime
		const copDuration = this._buffWindows[STATUSES.CIRCLE_OF_POWER.id].history.reduce((duration, cop) => duration + Math.max(cop.stop - cop.start, 0), 0)
		const linesDuration = this._buffWindows[STATUSES.LEY_LINES.id].history.reduce((duration, lines) => duration + Math.max(lines.stop - lines.start, 0), 0)

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your Ley Lines</Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your Ley Lines after placing them. Take advantage of Ley Lines' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a Ley Lines' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...ACTIONS.LEY_LINES} />,
					percent: this._dontMovePercent(copDuration, linesDuration),
				}),
			],
			//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
			target: 90,
		}))
	}

	output() {
		return <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="blm.leylines.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.leylines.uptime-header">Uptime</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this._buffWindows[STATUSES.LEY_LINES.id].history.map(leyLinesEvent => {
					// Find the CoPs that were inside this Ley Lines
					const thisCoPHistory = this._buffWindows[STATUSES.CIRCLE_OF_POWER.id].history.filter(cops => ((cops.start >= leyLinesEvent.start) & (cops.stop <= leyLinesEvent.stop)))

					// For this set of CoPs, get the uptime
					const thisCoPUptime = thisCoPHistory.reduce((duration, cop) => duration + Math.max(cop.stop - cop.start, 0), 0)

					// Note that since we're getting the actual duration, rather than the expected duration,
					// technically we'll call it 100% uptime if you stay in the lines and die halfway through...
					// However, since that'll get flagged as a morbid checklist item, that's probably ok.
					const thisPercent = this._dontMovePercent(thisCoPUptime, leyLinesEvent.stop - leyLinesEvent.start).toFixed(2)

					return <Table.Row key={leyLinesEvent.start}>
						<Table.Cell>{this.parser.formatTimestamp(leyLinesEvent.start)}</Table.Cell>
						<Table.Cell>{thisPercent}%</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(leyLinesEvent.start - this.parser.fight.start_time, leyLinesEvent.stop - this.parser.fight.start_time)}>
								<Trans id="blm.leylines.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
