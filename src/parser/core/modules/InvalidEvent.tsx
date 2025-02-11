import {t} from "@lingui/macro"
import {Trans} from "@lingui/react"
import {Event, PREPULL_EVENT_WINDOW} from "event"
import {Analyser} from "../Analyser"
import {dependency} from "../Injectable"
import {BrokenLog} from "./BrokenLog"

export class InvalidEvent extends Analyser {
	static override handle = 'invalidEvent'
	static override title = t('core.invalid-event.title')`Invalid Event`

	@dependency private brokenLog!: BrokenLog

	override initialise(): void {
		const firstEventHook = this.addEventHook(
			(event): event is Event => true,
			event => {
				this.removeEventHook(firstEventHook)
				this.onFirstEvent(event)
			}
		)
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
