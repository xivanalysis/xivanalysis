//                     Lv.89 DRIFTING EA
//
//                          ``......`
//                 `-:+sydmNNNNNNNNNNNmdys+:.
//             .:ohmNMMMMMMMMMMMMMMMMMMMMMMMNmy+-
//          .+hNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNdo.
//       `:hNMMMMMMMMMMMMMMMMMMMMMMMMMMNmmmNMMMMMMMNy-
//      /dMMMMMMMMMMMMMMMMMMMMMMMMMMms:-....:ohNMMMMMNs.
//    .yMMMMMMMMMMMMMMMMMMMMMMMMMMMs.          .omMMMMMm/
//   -mMMMMMMMMMMMMMMMMMMMMMMMMMMMs          --. .sNMMMMMs`
//  .mMMMMMMMMMMMMMMMMMMMMMMMMMMMM. yhy:    :MMNs  :NMMMMMy`
//  hMMMMMMMMMMMMMMMMMMMMMMMMMMMMM. mMMM:   `hMMM.  :MMMMMMo
// -MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMo .yNN/    `:o+    sMMMMMM-
// oMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM/  ``             .MMMMMMy
// sMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMs`                dMMMMMM`
// +MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm-               sMMMMMM:
// .MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMo              /MMMMMM+
//  hMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMh`            :MMMMMMo
//  .MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMd.           -MMMMMM:
//   +MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMd`          -MMMMMN`
//    yMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMh          -MMMMMo
//    `dMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM/         -MMMMN.
//     .mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMo         .MMMMy
//      -NMMMMMMMMMMMMMMMMMyNMMMMMMMMMMMMMMM:         .MMMM:
//       :NMMMMMMMMMMMMMMMMd-hMMMMdoMMMMMMMN`         `MMMM`
//        /NMMMMMMMhhMMMMMMM/`:so:` NMMMMMMd           NMMN
//         /NMMMMMMy /mMN++hd`      oMMMMMMm           yMMM
//          /NMMMMMo  `+h   .`       +NMMMMM/          -MMM`
//           +MMMMM-                  .sNMMMN-          +MM:
//            dMMM+                     .omMMm.          +Ns
//            :Mm:                         :smm-          ./
//             /                              -+-

import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Tooltip, {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Button, Message, Table} from 'semantic-ui-react'

// Buffer (ms) to forgive insignificant drift
const DRIFT_BUFFER = 2000

// Buffer (ms) to allow for reopeners after a downtime
const REOPENER_BUFFER = 4000
const MIN_REOPENER_DOWNTIME = 15000

// Timeline padding to see the drifted oGCD when you jump to the window
const TIMELINE_PADDING = 2500

interface DriftWindow {
	start: number
}

interface ConfirmedDriftWindow extends DriftWindow {
	driftedActionId: number
	drift: number
	end: number
}

export class DriftingEa extends Analyser {
	static override handle = 'drifting-ea'
	static override title = t('brd.drifting-ea.title')`Empyreal Arrow Drift`

	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private timeline!: Timeline

	private driftedWindows: ConfirmedDriftWindow[] = []

	private currentWindow: DriftWindow =  {
		start: this.parser.pull.timestamp,
	}

	override initialise() {
		const eaId = this.data.actions.EMPYREAL_ARROW.id

		const castFilter = filter<Event>()
			.type('action')
			.source(this.parser.actor.id)

		this.addEventHook(castFilter.action(eaId), this.onDriftableCast)
	}

	private onDriftableCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		if (!action || !action.cooldown) { return }

		const window = this.currentWindow
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
		this.currentWindow = {
			start: observedUseTime,
		}
	}

	override output() {
		// Nothing to show
		if (!this.driftedWindows.length) { return }

		const driftTable = <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="brd.drifting-ea.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.drifting-ea.drift-header">Drift Issue</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.driftedWindows.map(window => {
					return <Table.Row key={window.start}>
						<Table.Cell>{this.parser.formatEpochTimestamp(window.end)}</Table.Cell>
						<Table.Cell>
							<Trans id="brd.drifting-ea.drift-issue">
								<ActionLink {...this.data.getAction(window.driftedActionId)}/> drifted by {this.parser.formatDuration(window.drift)}
							</Trans>
						</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(window.start - this.parser.pull.timestamp, window.end + TIMELINE_PADDING - this.parser.pull.timestamp)}>
								<Trans id="brd.drifting-ea.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>

		return <Fragment>
			<Message>
				<Trans id="brd.drifting-ea.accordion.message">
					<ActionLink action="EMPYREAL_ARROW"/> is your most valuable oGCD thanks to <Tooltip sheet="Trait" id={169}/>, and should be used on cooldown.
				</Trans>
			</Message>
			{driftTable}
		</Fragment>
	}
}
