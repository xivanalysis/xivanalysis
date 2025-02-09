import {Trans} from '@lingui/react'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor} from 'report'
import {BrokenLog} from '../BrokenLog'
import {SimpleItem, SimpleRow, Timeline} from '../Timeline'
import {STATUS_IDS} from './statusIds'

export interface Window {
	/** Number of events currently causing inability to act. */
	depth: number
	/** The start time of this window. */
	start: number
	/** The end time of this window. If `depth > 0`, will be `Infinity`. */
	end: number
	/** Events causing inability to act. */
	applyEvents: Array<Events['statusApply']>
	/** Events counteracting inability to act. */
	removeEvents: Array<Events['statusRemove'] | Events['complete']>
}

export interface WindowFilter {
	/** Actor ID to retrieve windows for. */
	actorId?: Actor['id']
	/** Omit windows closed prior to this timestamp. */
	start?: number
	/** Omit windows opened after this timestamp. */
	end?: number
}

export class UnableToAct extends Analyser {
	static override handle = 'unableToAct'
	static override debug = false

	@dependency private brokenLog!: BrokenLog
	@dependency private timeline!: Timeline

	private actorWindows = new Map<Actor['id'], Window[]>()

	/**
	 * Get unable to act windows for the specified actor that intersect with the
	 * provided range. Defaults to all windows for the currently parsed actor.
	 */
	getWindows({
		actorId = this.parser.actor.id,
		start = this.parser.pull.timestamp,
		end = this.parser.currentEpochTimestamp,
	}: WindowFilter = {}) {
		return this.getActorWindows(actorId)
			.filter(window => window.end > start && window.start < end)
	}

	/**
	 * Get the duration that specified actor was unable to act within the provided
	 * range. Defaults to total time unable to act for the currently parsed actor.
	 */
	getDuration({
		actorId = this.parser.actor.id,
		start = this.parser.pull.timestamp,
		end = this.parser.currentEpochTimestamp,
	}: WindowFilter = {}) {
		return this.getWindows({actorId, start, end})
			.reduce((duration, window) => duration + Math.min(window.end, end) - Math.max(window.start, start), 0)
	}

	/**
	 * Check if the specified actor was unable to act at the provided timestamp.
	 * Defaults to checking the parsed actor at the current timestamp.
	 */
	isUnableToAct({
		actorId = this.parser.actor.id,
		timestamp = this.parser.currentEpochTimestamp,
	}: {
		actorId?: Actor['id']
		timestamp?: number
	} = {}) {
		return this.getWindows({
			actorId,
			start: timestamp,
			end: timestamp,
		}).length > 0
	}

	override initialise() {
		const statusFilter = filter<Event>().status(oneOf(STATUS_IDS))
		this.addEventHook(statusFilter.type('statusApply'), this.onApply)
		this.addEventHook(statusFilter.type('statusRemove'), this.onRemove)

		this.addEventHook('complete', this.onComplete)
	}

	private onApply(event: Events['statusApply']) {
		const windows = this.getActorWindows(event.target)

		// Get the latest window, building a new one if there is none, or the previous is complete
		let window: Window | undefined = windows[windows.length - 1]
		if (window == null || window.depth <= 0) {
			window = {
				depth: 0,
				start: event.timestamp,
				end: Infinity,
				applyEvents: [],
				removeEvents: [],
			}
			windows.push(window)
		}

		window.depth++
		window.applyEvents.push(event)
	}

	private onRemove(event: Events['statusRemove']) {
		const windows = this.getActorWindows(event.target)

		// Make sure nothing's gone wrong
		const window: Window | undefined = windows[windows.length - 1]
		if (window == null || window.depth <= 0) {
			this.brokenLog.trigger(this, 'no valid window to close', (
				<Trans id="core.unable-to-act.no-valid-window">
					Actor {event.target} has no valid window to end.
				</Trans>
			))
			return
		}

		this.decrementWindow(window, event)
	}

	private onComplete(event: Events['complete']) {
		// Clear out any open windows
		for (const windows of this.actorWindows.values()) {
			if (windows.length === 0) { continue }
			const window = windows[windows.length - 1]
			while (window.depth > 0) {
				this.decrementWindow(window, event)
			}
		}

		this.debug(() => this.renderDebugTimelineData())
	}

	private getActorWindows(actorId: Actor['id']) {
		let windows = this.actorWindows.get(actorId)
		if (windows == null) {
			windows = []
			this.actorWindows.set(actorId, windows)
		}
		return windows
	}

	private decrementWindow(
		window: Window,
		event: Events['statusRemove'] | Events['complete'],
	) {
		window.depth--
		window.removeEvents.push(event)
		if (window.depth <= 0) {
			window.end = event.timestamp
		}
	}

	private renderDebugTimelineData() {
		const startTime = this.parser.pull.timestamp
		const parentRow = this.timeline.addRow(new SimpleRow({
			label: 'UTA2 Debug',
			order: -Infinity,
		}))

		for (const [actorId, windows] of this.actorWindows.entries()) {
			const actor = this.parser.pull.actors.find(actor => actor.id === actorId)
			const row = parentRow.addRow(new SimpleRow({
				label: actor != null
					? `${actor.name} (${actorId})`
					: actorId,
			}))

			for (const window of windows) {
				row.addItem(new SimpleItem({
					start: window.start - startTime,
					end: window.end - startTime,
					content: <div style={{width: '100%', height: '100%', backgroundColor: '#aaf'}}/>,
				}))
			}
		}
	}
}
