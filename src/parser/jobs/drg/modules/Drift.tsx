import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Message, Table, Button} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Downtime from 'parser/core/modules/Downtime'
import {getDataBy} from 'data'
import Module, {dependency} from 'parser/core/Module'
import React, {Fragment} from 'react'
import {Timeline} from 'parser/core/modules/Timeline'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Buffer (ms) to forgive insignificant drift, we really only care about GCD drift here
// and not log inconsistencies / sks issues / misguided weaving
const DRIFT_BUFFER = 1250

const DRIFT_ABILITIES = [
	ACTIONS.HIGH_JUMP.id,
	ACTIONS.GEIRSKOGUL.id,
]

const COOLDOWN_MS = {
	[ACTIONS.HIGH_JUMP.id]: ACTIONS.HIGH_JUMP.cooldown * 1000,
	[ACTIONS.GEIRSKOGUL.id]: ACTIONS.GEIRSKOGUL.cooldown * 1000,
}

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

export default class Drift extends Module {
	static debug = false
	static handle = 'drift'
	static title = t('drg.drift.title')`Ability Drift`
	static displayOrder = DISPLAY_ORDER.DRIFT


	@dependency private downtime!: Downtime
	@dependency private timeline!: Timeline

	private driftedWindows: DriftWindow[] = []

	private currentWindows = {
		[ACTIONS.HIGH_JUMP.id]: new DriftWindow(ACTIONS.HIGH_JUMP.id, this.parser.fight.start_time),
		[ACTIONS.GEIRSKOGUL.id]: new DriftWindow(ACTIONS.GEIRSKOGUL.id, this.parser.fight.start_time),
	}

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: DRIFT_ABILITIES}, this.onDriftableCast)
	}

	private onDriftableCast(event: CastEvent) {
		// Get skill info.
		let actionId: number
		actionId = event.ability.guid

		const cooldown = COOLDOWN_MS[actionId]
		// this.debug(cooldown)

		// Calculate drift
		const window = this.currentWindows[actionId]
		window.end = event.timestamp

		const plannedUseTime = window.start + cooldown
		this.debug(this.parser.formatTimestamp(plannedUseTime))

		let expectedUseTime = 0

		if (this.downtime.isDowntime(plannedUseTime)) {
			const downtimeWindow = this.downtime.getDowntimeWindows(plannedUseTime)[0]
			expectedUseTime = downtimeWindow.end
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
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}

	private createDriftTable(casts: DriftWindow[]) {
		let totalDrift = 0
		if (casts.length === 0) { // Don't draw table if nothing was cast.
			return
		}
		const action = getDataBy(ACTIONS, 'id', casts[0].actionId)
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

	output() {
		// Nothing to show
		if (!this.driftedWindows.length) return

		return <Fragment>
			<Table style={{border: 'none'}}>
				<Table.Body>
					<Table.Row>
						<Table.Cell style={{verticalAlign: 'top'}}>
							{this.createDriftTable(this.driftedWindows.filter((ability) => {
								return ability.actionId === ACTIONS.HIGH_JUMP.id
							}))}
						</Table.Cell>
						<Table.Cell style={{verticalAlign: 'top'}}>
							{this.createDriftTable(this.driftedWindows.filter((ability) => {
								return ability.actionId === ACTIONS.GEIRSKOGUL.id
							}))}
						</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table>
		</Fragment>
	}
}
