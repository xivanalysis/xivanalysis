import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {SimpleRow, StatusItem, Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Table, Button} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

interface LeyLinesWindow {
	start: number,
	stop?: number
}

interface LeyLinesWindows {
	current?: LeyLinesWindow,
	history: LeyLinesWindow[]
}

export default class Leylines extends Analyser {
	static handle = 'leylines'
	static title = t('blm.leylines.title')`Ley Lines`
	static displayOrder = DISPLAY_ORDER.LEY_LINES

	@dependency data!: Data
	@dependency checklist!: Checklist
	@dependency timeline!: Timeline

	private leyLinesStatuses: number[] = [
		this.data.statuses.LEY_LINES.id,
		this.data.statuses.CIRCLE_OF_POWER.id,
	]

	private buffWindows: Map<number, LeyLinesWindows> = new Map<number, LeyLinesWindows>()

	initialise() {
		const leyLinesFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(oneOf(this.leyLinesStatuses))
		this.addEventHook(leyLinesFilter.type('statusApply'), this.onGain)
		this.addEventHook(leyLinesFilter.type('statusRemove'), this.onDrop)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)

		this.leyLinesStatuses.forEach(status => {
			this.buffWindows.set(status, {history: []})
		})
	}

	// Manage buff windows
	private onGain(event: Events['statusApply']) {
		const status = getDataBy(STATUSES, 'id', event.status)

		// Something is not right
		if (!status) { return }

		// Track the new window
		const tracker = this.buffWindows.get(status.id)
		if (tracker == null) { return }

		tracker.current = {
			start: event.timestamp,
		}
	}

	private onDrop(event: Events['statusRemove']) {
		this.stopAndSave(event.status, event.timestamp)
	}

	// We died, close windows
	private onDeath(event: Events['death']) {
		this.leyLinesStatuses.forEach(status => {
			this.stopAndSave(status, event.timestamp)
		})
	}

	// Finalise a buff window
	private stopAndSave(statusId: number, endTime: number = this.parser.currentEpochTimestamp) {
		const tracker = this.buffWindows.get(statusId)
		if (tracker == null) { return }

		// Already closed, nothing to do here
		if (!tracker.current) { return }

		// Close the window
		tracker.current.stop = endTime
		tracker.history.push(tracker.current)
		tracker.current = undefined

		// Close dependency windows
		if (statusId === STATUSES.LEY_LINES.id) {
			this.stopAndSave(STATUSES.CIRCLE_OF_POWER.id, endTime)
		}
	}

	// A reminder of man's ability to generate electricity
	private dontMovePercent(power: number, lines: number) {
		return (power / lines) * 100
	}

	private onComplete() {
		// Current time will be end of fight so no need to pass it here
		if (this.buffWindows.get(STATUSES.LEY_LINES.id)?.current) {
			this.stopAndSave(STATUSES.LEY_LINES.id)
		}

		// Build the grouping row
		const parentRow = this.timeline.addRow(new SimpleRow({
			label: 'Ley Lines Buffs',
			order: 0,
		}))

		// For each buff, add it to timeline
		this.leyLinesStatuses.forEach(buff => {
			const status = getDataBy(STATUSES, 'id', buff)
			if (status == null) { return }
			const row = parentRow.addRow(new SimpleRow({label: status.name}))

			const fightStart = this.parser.pull.timestamp

			this.buffWindows.get(buff)?.history.forEach(window => {
				row.addItem(new StatusItem({
					status,
					start: window.start - fightStart,
					end: window.stop || (fightStart + this.parser.pull.duration) - fightStart, // stop should always actually be set by now but just in case, default to the end of the pull
				}))
			})
		})

		// Get the total duration of CoP uptime and Ley Lines, so we can get the overall percentage uptime
		const copDuration = this.buffWindows.get(STATUSES.CIRCLE_OF_POWER.id)?.history.reduce((duration, cop) => duration + Math.max(cop.stop || 0 - cop.start, 0), 0)
		const linesDuration = this.buffWindows.get(STATUSES.LEY_LINES.id)?.history.reduce((duration, lines) => duration + Math.max(lines.stop || 0 - lines.start, 0), 0)

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your <ActionLink {...this.data.actions.LEY_LINES} /></Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} /> after placing them. Take advantage of <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...ACTIONS.LEY_LINES} />,
					percent: this.dontMovePercent(copDuration || 0, linesDuration || 0),
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
				{this.buffWindows.get(STATUSES.LEY_LINES.id)?.history.map(leyLinesEvent => {
					// Find the CoPs that were inside this Ley Lines
					const thisCoPHistory = this.buffWindows.get(STATUSES.CIRCLE_OF_POWER.id)?.history.filter(cops => ((cops.start >= leyLinesEvent.start) && ((cops.stop || 0) <= (leyLinesEvent.stop || 0)))) || []

					// For this set of CoPs, get the uptime
					const thisCoPUptime = thisCoPHistory.reduce((duration, cop) => duration + Math.max(cop.stop || 0 - cop.start, 0), 0)

					// Note that since we're getting the actual duration, rather than the expected duration,
					// technically we'll call it 100% uptime if you stay in the lines and die halfway through...
					// However, since that'll get flagged as a morbid checklist item, that's probably ok.
					const thisPercent = this.dontMovePercent(thisCoPUptime, leyLinesEvent.stop || 0 - leyLinesEvent.start).toFixed(2)

					return <Table.Row key={leyLinesEvent.start}>
						<Table.Cell>{this.parser.formatTimestamp(leyLinesEvent.start)}</Table.Cell>
						<Table.Cell>{thisPercent}%</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(leyLinesEvent.start - this.parser.pull.timestamp, leyLinesEvent.stop || 0 - this.parser.pull.timestamp)}>
								<Trans id="blm.leylines.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
