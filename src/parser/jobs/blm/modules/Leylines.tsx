import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
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

	private buffWindows: {[key: number]: LeyLinesWindows} = {}

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
			this.buffWindows[status] = {history: []}
		})
	}

	// Manage buff windows
	private onGain(event: Events['statusApply']) {
		const status = this.data.getStatus(event.status)

		// Something is not right
		if (!status) { return }

		// Track the new window
		const tracker = this.buffWindows[status.id]

		// Don't open a new window if one's already going
		if (tracker.current) { return }

		tracker.current = {
			start: event.timestamp,
		}
	}

	private onDrop(event: Events['statusRemove']) {
		this.stopAndSave(event.status, event.timestamp)
	}

	// We died, close windows
	private onDeath(event: Events['death']) {
		this.stopAndSave(this.data.statuses.LEY_LINES.id, event.timestamp)
	}

	// Finalise a buff window
	private stopAndSave(statusId: number, endTime: number = this.parser.currentEpochTimestamp) {
		const tracker = this.buffWindows[statusId]

		// Already closed, nothing to do here
		if (!tracker.current) { return }

		// Close the window
		tracker.current.stop = endTime
		tracker.history.push(tracker.current)
		tracker.current = undefined

		// Close dependency windows
		if (statusId === this.data.statuses.LEY_LINES.id) {
			this.stopAndSave(this.data.statuses.CIRCLE_OF_POWER.id, endTime)
		}
	}

	// A reminder of man's ability to generate electricity
	private dontMovePercent(power: number, lines: number) {
		return (power / lines) * 100
	}

	private onComplete() {
		// Current time will be end of fight so no need to pass it here
		this.stopAndSave(this.data.statuses.LEY_LINES.id)

		// Build the grouping row
		const parentRow = this.timeline.addRow(new SimpleRow({
			label: 'Ley Lines Buffs',
			order: 0,
		}))

		const fightStart = this.parser.pull.timestamp

		// For each buff, add it to timeline
		this.leyLinesStatuses.forEach(buff => {
			const status = this.data.getStatus(buff)
			if (!status) { return }

			const row = parentRow.addRow(new SimpleRow({label: status.name}))

			this.buffWindows[buff].history.forEach(window => {
				if (!window.stop) { return }
				row.addItem(new StatusItem({
					status,
					start: window.start - fightStart,
					end: window.stop - fightStart,
				}))
			})
		})

		// Get the total duration of CoP uptime and Ley Lines, so we can get the overall percentage uptime
		const copDuration = this.buffWindows[this.data.statuses.CIRCLE_OF_POWER.id].history.reduce((duration, cop) => duration + Math.max((cop.stop || 0) - cop.start, 0), 0)
		const linesDuration = this.buffWindows[this.data.statuses.LEY_LINES.id].history.reduce((duration, lines) => duration + Math.max((lines.stop || 0) - lines.start, 0), 0)

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your <ActionLink {...this.data.actions.LEY_LINES} /></Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} /> after placing them. Take advantage of <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...this.data.actions.LEY_LINES} />,
					percent: this.dontMovePercent(copDuration, linesDuration),
				}),
			],
			//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
			target: 90,
		}))
	}

	output() {
		const fightEnd = this.parser.pull.timestamp + this.parser.pull.duration
		return <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="blm.leylines.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.leylines.uptime-header">Uptime</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.buffWindows[this.data.statuses.LEY_LINES.id].history.map(leyLinesEvent => {
					// Find the CoPs that were inside this Ley Lines
					const thisCoPHistory = this.buffWindows[this.data.statuses.CIRCLE_OF_POWER.id].history.filter(cops => ((cops.start >= leyLinesEvent.start) && ((cops.stop || 0) <= (leyLinesEvent.stop || 0))))

					// For this set of CoPs, get the uptime
					const thisCoPUptime = thisCoPHistory.reduce((duration, cop) => duration + Math.max((cop.stop || 0) - cop.start, 0), 0)

					// Note that since we're getting the actual duration, rather than the expected duration,
					// technically we'll call it 100% uptime if you stay in the lines and die halfway through...
					// However, since that'll get flagged as a morbid checklist item, that's probably ok.
					const thisPercent = this.dontMovePercent(thisCoPUptime, (leyLinesEvent.stop || fightEnd) - leyLinesEvent.start).toFixed(2)

					return <Table.Row key={leyLinesEvent.start}>
						<Table.Cell>{this.parser.formatEpochTimestamp(leyLinesEvent.start)}</Table.Cell>
						<Table.Cell>{thisPercent}%</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(leyLinesEvent.start - this.parser.pull.timestamp, (leyLinesEvent.stop || fightEnd) - this.parser.pull.timestamp)}>
								<Trans id="blm.leylines.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
