import {RotationTable, RotationTableNotesMap, RotationTableTargetData} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {ensureArray, isDefined} from 'utilities'
import {Analyser} from '../../../Analyser'
import {EventHook} from '../../../Dispatcher'
import {filter, noneOf, oneOf} from '../../../filter'
import {Data} from '../../Data'
import {History, HistoryEntry} from '../../History'
import Suggestions from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'
import {WindowEvaluator} from '../evaluators/WindowEvaluator'

/**
 * Tracks actions that occur within a window.
 * By default, all actions cast during a window will be included.
 */
export abstract class ActionWindow extends Analyser {

	@dependency protected data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	/**
	 * The captured windows.
	 */
	private history = new History<Array<Events['action']>>(() => [])
	/**
	 * The default event hook for all actions.  This can be removed via removeDefaultEventHook
	 * by classes that want to limit which actions are included in a window.
	 */
	private defaultEventHook?: EventHook<Events['action']>
	/**
	 * The evaluators used to generate suggestions and output for the windows.
	 */
	private evaluators: WindowEvaluator[] = []

	/**
	 * Implementing modules MAY provide a value to override the "Rotation" title in the header of the rotation section
	 * If implementing, you MUST provide a JSX.Element <Trans> or <Fragment> tag (Trans tag preferred)
	 */
	protected rotationTableHeader?: JSX.Element

	/**
	 * Adds an evaluator to be run on the windows.
	 * @param evaluator An evaluator to be run on the windows
	 */
	protected addEvaluator(evaluator: WindowEvaluator) {
		this.evaluators.push(evaluator)
	}

	/**
	 * Starts a new window if one is not already open.
	 * @param timestamp The timestamp at which the new window starts.
	 */
	protected onWindowStart(timestamp: number) {
		this.history.getCurrentOrOpenNew(timestamp)
	}
	/**
	 * Ends an existing window if one is open.
	 * @param timestamp The timestamp at which the window ends.
	 */
	protected onWindowEnd(timestamp: number) {
		this.history.closeCurrent(timestamp)
	}
	/**
	 * Adds an action to the current window if one is open.
	 * If no window is open, the event is ignored.
	 * Implementing moudles MUST call removeDefaultActionHook before calling this method directly.
	 * @param event The event to be added to the window.
	 */
	protected onWindowAction(event: Events['action']) {
		this.history.doIfOpen(current => current.push(event))
	}

	/**
	 * Removes the default event hook that captures all actions by the player.
	 * Implementing modules should call this method if they have logic to only
	 * include some actions in a window.
	 * Implmenting modules MUST register their own hook that calls onWindowAction
	 * after calling this method.
	 */
	protected removeDefaultActionHook() {
		if (this.defaultEventHook != null) {
			this.removeEventHook(this.defaultEventHook)
			this.defaultEventHook = undefined
		}
	}
	/**
	 * Adjusts the default event hook to ignore certain actions.
	 * Implementing modules MAY call this method if all casts of certain
	 * actions should be ignored in a window.
	 * If actions are only ignored in some conditions, this method is
	 * not suitable, and you will need to register your own hook and callback
	 * that only calls onWindowAction when the conditions are met.
	 * Calling this method will override previous calls to trackOnlyActions.
	 * @param actionsToIgnore The ids of the actions to ignore.
	 */
	protected ignoreActions(actionsToIgnore: number[]) {
		this.removeDefaultActionHook()
		this.defaultEventHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(noneOf(actionsToIgnore))
				.type('action'),
			this.onWindowAction)
	}
	/**
	 * Adjusts the default event hook to only track certain actions.
	 * Implementing modules MAY call this method if only some actions should
	 * be tracked in a window.
	 * If other actions should be tracked in some conditions, this method is
	 * not suitable, and you will need to register your own hook and callback
	 * that only calls onWindowAction when the conditions are met.
	 * Calling this method will override previous calls to ignoreActions.
	 * @param actionsToTrack The ids of the actions to track.
	 */
	protected trackOnlyActions(actionsToTrack: number[]) {
		this.removeDefaultActionHook()
		this.defaultEventHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(oneOf(actionsToTrack))
				.type('action'),
			this.onWindowAction)
	}

	override initialise() {
		this.defaultEventHook = this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onWindowAction)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		this.onWindowEnd(this.parser.pull.timestamp + this.parser.pull.duration)

		const actionHistory = this.mapHistoryActions()
		this.evaluators
			.forEach(ev => {
				const suggestion = ev.suggest(actionHistory)
				if (suggestion != null) {
					this.suggestions.add(suggestion)
				}
			})
	}

	override output() {
		if (this.history.entries.length === 0) { return undefined }

		const actionHistory = this.mapHistoryActions()
		const evalColumns: EvaluationOutput[]  = []
		for (const ev of this.evaluators) {
			const maybeColumns = ev.output(actionHistory)
			if (maybeColumns == null) { continue }
			for (const column of ensureArray(maybeColumns)) {
				evalColumns.push(column)
			}
		}

		const rotationTargets = evalColumns.filter(column => column.format === 'table').map(column => column.header)
		const notesData = evalColumns.filter(column => column.format === 'notes').map(column => column.header)
		const rotationData = this.history.entries
			.map((window, idx) => {
				const targetsData: RotationTableTargetData = {}
				const notesMap: RotationTableNotesMap = {}
				evalColumns.forEach(column => {
					if (typeof column.header.accessor !== 'string') { return }
					const colName = column.header.accessor
					if (column.format === 'table') {
						targetsData[colName] = column.rows[idx]
					} else {
						notesMap[colName] = column.rows[idx]
					}
				})
				return {
					start: window.start - this.parser.pull.timestamp,
					end: (window.end ?? window.start) - this.parser.pull.timestamp,
					targetsData,
					rotation: window.data.map(event => { return {action: event.action} }),
					notesMap,
				}
			})

		return <RotationTable
			targets={rotationTargets}
			data={rotationData}
			notes={notesData}
			onGoto={this.timeline.show}
			headerTitle={this.rotationTableHeader}
		/>
	}

	private mapHistoryActions(): Array<HistoryEntry<EvaluatedAction[]>> {
		return this.history.entries
			.map(entry => ({start: entry.start,
				end: entry.end,
				data: entry.data
					.map(ev => {
						const action = this.data.getAction(ev.action)
						if (action == null) { return undefined }
						return {...ev, action}
					})
					.filter(isDefined),
			}))
	}
}
