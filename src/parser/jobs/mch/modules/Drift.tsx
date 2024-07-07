import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Button, Message, Table} from 'semantic-ui-react'

// Buffer (ms) to forgive insignificant drift, we really only care about GCD drift here
// and not log inconsistencies / sks issues / misguided weaving
const DRIFT_BUFFER = 1500

// Buffer (ms) to allow for reopeners after a downtime, since the GCD that "drifted"
// might not have first priority
const REOPENER_BUFFER = 12500
const MIN_REOPENER_DOWNTIME = 15000

// Timeline padding to see the drifted GCD when you jump to the window
const TIMELINE_PADDING = 2500

const DRIFT_GCDS: ActionKey[] = [
	'AIR_ANCHOR',
	'CHAIN_SAW',
]

interface DriftWindow {
	start: number
	casts: Array<Events['action']>
}

interface ConfirmedDriftWindow extends DriftWindow {
	driftedActionId: number
	drift: number
	end: number
}

export class Drift extends Analyser {
	static override handle = 'drift'
	static override title = t('mch.drift.title')`GCD Drift`

	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private timeline!: Timeline

	private driftIds: number[] = []
	private driftedWindows: ConfirmedDriftWindow[] = []

	private currentWindows: { [groupId: number]: DriftWindow } = {
		[this.data.actions.AIR_ANCHOR.id]: {
			start: this.parser.pull.timestamp,
			casts: [],
		},
		[this.data.actions.CHAIN_SAW.id]: {
			start: this.parser.pull.timestamp,
			casts: [],
		},
	}

	override initialise() {
		this.driftIds = DRIFT_GCDS.map(actionKey => this.data.actions[actionKey].id)

		const castFilter = filter<Event>()
			.type('action')
			.source(this.parser.actor.id)

		this.addEventHook(castFilter.action(oneOf(this.driftIds)), this.onDriftableCast)
		this.addEventHook(castFilter, this.onCast)
	}

	private onDriftableCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		if (!action || !action.cooldown) { return }

		const id = action.cooldownGroup ?? action.id
		const window = this.currentWindows[id]
		const observedUseTime = event.timestamp

		// Cap at this event's timestamp, just in case
		const earliestUseTime = Math.min(window.start + action.cooldown, observedUseTime)

		let expectedUseTime = earliestUseTime

		// Increase the expected use time if it was in downtime
		if (this.downtime.isDowntime(earliestUseTime)) {
			const downtimeWindow = this.downtime.getDowntimeWindows(window.start, observedUseTime)[0]
			expectedUseTime = downtimeWindow.end

			// Forgive "drift" due to reopening with other actions after downtime
			if (downtimeWindow.end - downtimeWindow.start > MIN_REOPENER_DOWNTIME) {
				expectedUseTime += REOPENER_BUFFER
			}
		}

		const drift = Math.max(0, observedUseTime - expectedUseTime)

		// Forgive a small amount of drift
		if (drift > DRIFT_BUFFER) {
			this.driftedWindows.push({
				...window,
				driftedActionId: event.action,
				drift: drift,
				end: observedUseTime,
			})
		}

		// Begin the next window
		this.currentWindows[id] = {
			start: observedUseTime,
			casts: [],
		}
	}

	private onCast(event: Events['action']) {
		for (const window of Object.values(this.currentWindows)) {
			window.casts.push(event)
		}
	}

	override output() {
		// Nothing to show
		if (!this.driftedWindows.length) { return }

		const driftTable = <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="mch.drift.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="mch.drift.drift-header">Drift Issue</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.driftedWindows.map(window => {
					return <Table.Row key={window.start}>
						<Table.Cell>{this.parser.formatEpochTimestamp(window.end)}</Table.Cell>
						<Table.Cell>
							<Trans id="mch.drift.drift-issue">
								<ActionLink {...this.data.getAction(window.driftedActionId)}/> drifted by {this.parser.formatDuration(window.drift)}
							</Trans>
						</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(window.start - this.parser.pull.timestamp, window.end + TIMELINE_PADDING - this.parser.pull.timestamp)}>
								<Trans id="mch.drift.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>

		return <Fragment>
			<Message>
				<Trans id="mch.drift.accordion.message">
					<ActionLink action="CHAIN_SAW"/> and <ActionLink action="AIR_ANCHOR"/> are powerful GCDs and ideally they should always be kept on cooldown,
					unless you need to insert a filler GCD to adjust for skill speed. Avoid casting <ActionLink action="HYPERCHARGE"/> if
					Chain Saw or Air Anchor will come off cooldown within 8 seconds.
				</Trans>
			</Message>
			{driftTable}
		</Fragment>
	}
}
