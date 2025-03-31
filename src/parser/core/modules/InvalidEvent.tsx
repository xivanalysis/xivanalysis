import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {Event, PREPULL_EVENT_WINDOW} from "event"
import {Analyser} from "../Analyser"
import {dependency} from "../Injectable"
import {BrokenLog} from "./BrokenLog"
import {Data} from "./Data"

export class InvalidEvent extends Analyser {
	static override handle = 'invalidEvent'
	static override title = msg({id: 'core.invalid-event.title', message: 'Invalid Event'})

	@dependency private brokenLog!: BrokenLog
	@dependency private data!: Data

	override initialise(): void {
		const unknownAction = this.data.actions.UNKNOWN.id
		this.addEventHook({cause: {type: 'action', action: unknownAction}}, this.triggerUnknownCause)
		this.addEventHook({action: unknownAction}, this.triggerUnknownCause)

		const unknownStatus = this.data.statuses.UNKNOWN.id
		this.addEventHook({cause: {type: 'status', status: unknownStatus}}, this.triggerUnknownCause)
		this.addEventHook({status: unknownStatus}, this.triggerUnknownCause)

		// Listen to all events, but unhook after the first fire.
		const firstEventHook = this.addEventHook(
			(event): event is Event => true,
			event => {
				this.removeEventHook(firstEventHook)
				this.onFirstEvent(event)
			}
		)
	}

	private triggerUnknownCause() {
		this.brokenLog.trigger(this, 'unknown action', (
			<Trans id="core.broken-log.trigger.unknown-action">
					One or more actions were recorded incorrectly, and could not be parsed.
			</Trans>
		))
	}

	private onFirstEvent(event: Event) {
		// If the timestamp is inside the window, we've got nothing to worry about.
		if (event.timestamp >= this.parser.pull.timestamp - PREPULL_EVENT_WINDOW) {
			return
		}

		this.brokenLog.trigger(this, 'invalid timestamp', (
			<Trans id="core.invalid-event.trigger.invalid-timestamp">
				An event occured outside the permissible time window for the pull.
			</Trans>
		))
	}
}
