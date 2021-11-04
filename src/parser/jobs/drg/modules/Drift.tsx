import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Table, Button} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Buffer (ms) to forgive insignificant drift, we really only care about GCD drift here
// and not log inconsistencies / sks issues / misguided weaving
const DRIFT_BUFFER = 1250

const DRIFT_ABILITIES: ActionKey[] = [
	'HIGH_JUMP',
	'GEIRSKOGUL',
]

class DriftWindow {
	actionId: number
	start: number
	end: number = 0
	drift: number = 0

	constructor(actionId: number, start: number) {
		this.actionId = actionId
		this.start = start
	}
}

export default class Drift extends Analyser {
	static override debug = false
	static override handle = 'drift'
	static override title = t('drg.drift.title')`Ability Drift`
	static override displayOrder = DISPLAY_ORDER.DRIFT

	@dependency private downtime!: Downtime
	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private driftedWindows: DriftWindow[] = []

	private driftAbilities = DRIFT_ABILITIES.map(k => this.data.actions[k].id)
	private cooldownMs: Record<number, number> = {}

	private currentWindows: Record<number, DriftWindow> = {}

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.driftAbilities)), this.onDriftableCast)

		DRIFT_ABILITIES.forEach(id => {
			const action = this.data.actions[id]
			this.cooldownMs[action.id] = action.cooldown ?? 0
			this.currentWindows[action.id] = new DriftWindow(action.id, this.parser.fight.start_time)
		})
	}

	private onDriftableCast(event: Events['action']) {
		// Get skill info.
		const actionId = event.action

		const cooldown = this.cooldownMs[actionId]
		// this.debug(cooldown)

		// Calculate drift
		const window = this.currentWindows[actionId]
		window.end = event.timestamp

		// Cap at this event's timestamp, as if we used before it came off CD, it's certainly driftless! (ms-range negative drift is common)
		const plannedUseTime = Math.min(window.start + cooldown, event.timestamp)
		this.debug(this.parser.formatEpochTimestamp(plannedUseTime))

		let expectedUseTime = 0

		if (this.downtime.isDowntime(plannedUseTime)) {
			const downtimeWindow = this.downtime.getDowntimeWindows(plannedUseTime, plannedUseTime)[0]

			// in theory the second case shouldn't trigger, but just in case since we've had this break before...
			expectedUseTime = downtimeWindow?.end ?? plannedUseTime
		} else {
			expectedUseTime = plannedUseTime
		}

		window.drift = Math.max(0, window.end - expectedUseTime)

		// Push to table.
		this.driftedWindows.push(window)
		this.currentWindows[actionId] = new DriftWindow(actionId, event.timestamp)
	}

	private createTimelineButton(timestamp: number) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.pull.timestamp, timestamp - this.parser.pull.timestamp)}
			content={this.parser.formatEpochTimestamp(timestamp)}
		/>
	}

	private createDriftTable(casts: DriftWindow[]) {
		let totalDrift = 0
		if (casts.length === 0) { // Don't draw table if nothing was cast.
			return
		}
		const action = this.data.getAction(casts[0].actionId)
		return <Table>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><ActionLink {...action} /> <Trans id="drg.drift.table.heading-1">Casts</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="drg.drift.table.heading-2">Drift</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="drg.drift.table.heading-3">Total Drift</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{casts.map((event, index) => {
					totalDrift += (index > 0) ? event.drift : 0
					return <Table.Row key={event.end} warning={event.drift > DRIFT_BUFFER}>
						<Table.Cell>{this.createTimelineButton(event.end)}</Table.Cell>
						<Table.Cell>{event.drift !== null && index > 0 ? this.parser.formatDuration(event.drift) : '-'}</Table.Cell>
						<Table.Cell>{totalDrift ? this.parser.formatDuration(totalDrift) : '-'}</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}

	override output() {
		// Nothing to show
		if (!this.driftedWindows.length) { return }

		return <Fragment>
			<Table style={{border: 'none'}}>
				<Table.Body>
					<Table.Row>
						<Table.Cell style={{verticalAlign: 'top'}}>
							{this.createDriftTable(this.driftedWindows.filter((ability) => {
								return ability.actionId === this.data.actions.HIGH_JUMP.id
							}))}
						</Table.Cell>
						<Table.Cell style={{verticalAlign: 'top'}}>
							{this.createDriftTable(this.driftedWindows.filter((ability) => {
								return ability.actionId === this.data.actions.GEIRSKOGUL.id
							}))}
						</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table>
		</Fragment>
	}
}
