import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {iconUrl} from 'data/icon'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Actors} from 'parser/core/modules/Actors'
import Suggestions, {TieredSuggestion, SEVERITY, SeverityTiers} from 'parser/core/modules/Suggestions'
import {SimpleRow, StatusItem, Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Button, Message, Table} from 'semantic-ui-react'
import {Analyser} from '../Analyser'
import {filter, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {Data} from './Data'
import Downtime from './Downtime'
import {Invulnerability} from './Invulnerability'

const TIMELINE_CONTEXT_DURATION = 15000 // 15s either side of the proc issue, 30s window overall

const ICON_HASTY_TOUCH = 1989
const ICON_MUSCLE_MEMORY = 1994

interface CurrentProcBuffWindow {
	start: number,
	consumingEvents: Array<Events['action']>,
	consumingInvulnEvents: Array<Events['action']>,
	nonConsumingEvents: Array<Events['action']>,
	overwritten: boolean,
	overwriteEvent?: Event
}

export interface ProcBuffWindow extends CurrentProcBuffWindow {
	stop: number,
}

export interface ProcGroup {
	procStatus: Status,
	consumeActions: Action[],
	mayOverwrite?: boolean,
}

type ProcIssueType =
	| 'dropped'
	| 'overwritten'
	| 'invuln'

interface ProcIssues {
	status: Status,
	timestamp: number,
	type: ProcIssueType,
}

type WindowEndReason =
	| 'removal'
	| 'overwrite'
	| 'endoffight'

const DEFAULT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export abstract class Procs extends Analyser {
	static override handle = 'procs'
	static override title = t('core.procs.title')`Proc Issues`

	@dependency private downtime!: Downtime
	@dependency protected suggestions!: Suggestions
	@dependency protected timeline!: Timeline
	@dependency protected actors!: Actors
	@dependency protected data!: Data
	@dependency protected invulnerability!: Invulnerability

	protected droppedProcs: number = 0
	protected overwrittenProcs: number = 0
	protected invulnUsages: number = 0

	/**
	 * Subclassing analysers must provide a list of tracked procs
	 * Note that if a given action can consume multiple proc statuses, the statuses should be listed in the order that the game will consume them
	 * See DNC's Procs subclass for an example
	 */
	protected abstract trackedProcs: ProcGroup[]

	/**
	 * Subclassing analysers may override these suggestion properties with relevant job-specific ones
	 */
	protected showDroppedProcSuggestion: boolean = false
	protected droppedProcIcon: string = iconUrl(ICON_HASTY_TOUCH)
	protected droppedProcContent: ReactNode = <Trans id="core.procs.suggestions.dropped.content">Avoid letting your procs fall off without using them. Proc actions are generally stronger than other actions and should not be wasted.</Trans>
	protected droppedProcSeverityTiers: SeverityTiers = DEFAULT_SEVERITY_TIERS

	protected showOverwroteProcSuggestion: boolean = false
	protected overwroteProcIcon: string = iconUrl(ICON_MUSCLE_MEMORY)
	protected overwroteProcContent: ReactNode = <Trans id="core.procs.suggestions.overwritten.content">Avoid using an action that could generate a proc when you already have that proc active.</Trans>
	protected overwroteProcSeverityTiers: SeverityTiers = DEFAULT_SEVERITY_TIERS

	protected showInvulnProcSuggestion: boolean = false
	protected invulnProcIcon: string = this.data.actions.HALLOWED_GROUND.icon // lol
	protected invulnProcContent: ReactNode = <Trans id="core.procs.suggestions.invuln.content">Try not to use your procs while the boss is invulnerable.</Trans>
	protected invulnProcSeverityTiers: SeverityTiers = DEFAULT_SEVERITY_TIERS

	/**
	 * Subclassing analysers may override this to toggle off timeline display
	 */
	protected showProcTimelineRow: boolean = true
	protected ProcGroupLabel: ReactNode = <Trans id="core.procs.group.label"> Proc </Trans>
	/**
	 * Subclassing analysers may override these to toggle on the output display of proc issues, and to control which issue types are shown in the output
	 */
	protected showProcIssueOutput: boolean = false
	protected showDroppedProcOutput: boolean = true
	protected showOverwrittenProcOutput: boolean = true
	protected showInvulnProcOutput: boolean = true
	protected procOutputHeader: ReactNode | undefined = undefined

	/**
	 * Subclassing analysers should not assign these directly. The corresponding override functions should be used instead to ensure that the
	 * variables needed for the Plurals typically used in suggestion Whys are ready for setting into the object
	 */
	protected droppedProcWhy!: ReactNode
	protected overwroteProcWhy!: ReactNode
	protected invulnProcWhy!: ReactNode

	/**
	 * Get the total number of stacks of the proc applied
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The total number of stacks of the proc applied during the fight
	 */
	protected getAppliedCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		const stacksPerWindow = procGroup.procStatus.stacksApplied ?? 1
		return this.getHistoryForStatus(status).length * stacksPerWindow
	}

	/**
	 * Get an array of usage events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of usage Events
	 */
	protected getUsagesForStatus(status: number | ProcGroup): Array<Events['action']> {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.getHistoryForStatus(status).reduce((usageEvents, window) => usageEvents.concat(window.consumingEvents), [] as Array<Events['action']>)
	}
	/**
	 * Get the number of times a proc was used
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was used
	 */
	protected getUsageCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.getUsagesForStatus(status).length
	}

	/**
	 * Checks to see if the specified event was a proc usage
	 * @param event The event to check
	 * @returns True if that event is contained in the usages group, false if not
	 */
	public checkEventWasProc(event: Events['action']): boolean {
		return this.checkActionWasProc(event.action, event.timestamp)
	}
	/**
	 * Checks to see if the specified action consumed a proc at a given timestamp
	 * @param actionId The action to check
	 * @param timestamp The timestamp to check
	 * @returns True if there was a tracked proc usage for the action at the given timestamp, false otherwise
	 */
	public checkActionWasProc(actionId: number, timestamp: number): boolean {
		const procGroups = this.getTrackedGroupsByAction(actionId)
		if (procGroups.length === 0) { return false }
		let wasProc = false
		for (const procGroup of procGroups) {
			wasProc = wasProc || this.getUsagesForStatus(procGroup).some(event => event.timestamp === timestamp)
		}
		return wasProc
	}

	/**
	 * Get an array of overwrite events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of overwrite Events
	 */
	protected getOverwrittenProcsForStatus(status: number | ProcGroup): ProcBuffWindow[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.getHistoryForStatus(status).filter(window => window.overwritten && !procGroup.mayOverwrite && this.considerOverwrittenProcs(window))
	}
	/**
	 * Get the number of times a proc was overwritten
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was overwritten
	 */
	protected getOverwriteCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		const stacksPerWindow = procGroup.procStatus.stacksApplied ?? 1
		return this.getOverwrittenProcsForStatus(status).reduce((overwritten, window) => {
			overwritten += Math.max(0, stacksPerWindow - window.consumingEvents.length)
			return overwritten
		}, 0)
	}

	/**
	 * If some overwrites should not be considered as bad, override this with logic to return false for overrides that are not considered bad.
	 * @param window The window that was overwritten
	 * @returns True if the overwrite should count as bad, False if the overwrite should not be counted
	 */
	protected considerOverwrittenProcs(_window: ProcBuffWindow): boolean {
		return true
	}

	/**
	 * Get an array of invulnerable usage events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of invulnerable usage Events
	 */
	protected getInvulnsForStatus(status: number | ProcGroup): Array<Events['action']> {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.getHistoryForStatus(status).reduce((invulnEvents, window) => invulnEvents.concat(window.consumingInvulnEvents), [] as Array<Events['action']>)
	}
	/**
	 * Get the number of times a proc was used on an invulnerable target
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was used on an invulnerable target
	 */
	protected getInvulnCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.getInvulnsForStatus(status).length
	}

	/**
	 * Get an array of dropped windows for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of invulnerable usage Events
	 */
	protected getDroppedWindowsForStatus(status: number | ProcGroup): ProcBuffWindow[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		const stacksPerWindow = procGroup.procStatus.stacksApplied ?? 1

		return this.getHistoryForStatus(status)
			.filter(window => window.overwritten === false && window.consumingEvents.length < stacksPerWindow && this.considerDroppedProcs(window))
	}

	/**
	 * Gets the number of times a proc was allowed to fall off
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was dropped (removals - usages)
	 */
	protected getDropCountForStatus(status: number| ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		const stacksPerWindow = procGroup.procStatus.stacksApplied ?? 1

		return this.getDroppedWindowsForStatus(status)
			.reduce((dropped, window) => {
				dropped += Math.max(0, stacksPerWindow - window.consumingEvents.length)
				return dropped
			}, 0)
	}

	/**
	 * Get an array of the proc issues we're going to display, for all statuses
	 * @returns The array of issues, sorted by timestamp
	 */
	private getDisplayedProcIssues(): ProcIssues[] {
		return this.trackedProcs.reduce((dropArray, procGroup) => {
			const droppedWindows: ProcIssues[] = this.showDroppedProcOutput ? this.getDroppedWindowsForStatus(procGroup).map(window => {
				return {
					status: procGroup.procStatus,
					timestamp: window.stop,
					type: 'dropped',
				}
			}) : []
			const overwriteWindows: ProcIssues[] = this.showOverwrittenProcOutput ? this.getOverwrittenProcsForStatus(procGroup).map(window => {
				return {
					status: procGroup.procStatus,
					timestamp: window.stop,
					type: 'overwritten',
				}
			}) : []
			const invulnWindows: ProcIssues[] = this.showInvulnProcOutput ? this.getInvulnsForStatus(procGroup).map(event => {
				return {
					status: procGroup.procStatus,
					timestamp: event.timestamp,
					type: 'invuln',
				}
			}) : []
			return dropArray.concat(droppedWindows).concat(overwriteWindows).concat(invulnWindows)
		}, [] as ProcIssues[]).sort((a, b) => a.timestamp - b.timestamp)
	}

	/**
	 * If some dropped procs should not be considered as bad, override this with logic to return false for drops that are not considered bad.
	 * Recommended to have your override return super.considerDroppedProcs && your logic, to still get the death and downtime forgiveness without having to copy the logic
	 * @param window The window that included dropped procs
	 * @returns True if the drop should count as bad, False if the drop should not be counted
	 */
	protected considerDroppedProcs(window: ProcBuffWindow): boolean {
		// Don't count procs that were dropped due to death
		if (this.actors.get(this.parser.actor).at(window.stop).hp.current === 0) { return false }

		// Don't count procs that were dropped due to downtime
		if (this.downtime.isDowntime(window.stop)) { return false }

		// Don't count procs that were dropped due to end of fight
		if (window.stop >= this.parser.pull.timestamp + this.parser.pull.duration) { return false }

		return true
	}

	protected currentWindows = new Map<ProcGroup, CurrentProcBuffWindow>()
	private history = new Map<ProcGroup, ProcBuffWindow[]>()
	/**
	 * Gets the array of buff windows for a specified status
	 * @param status The status to get windows for, as either the ID or a ProcGroup object
	 * @returns An array of ProcBuffWindows
	 */
	protected getHistoryForStatus(status: number| ProcGroup): ProcBuffWindow[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.history.get(procGroup) || []
	}

	private row!: SimpleRow
	private rows = new Map()

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('action'), this.onCast)

		const trackedProcStatusIds: number[] = this.trackedProcs.map(group => group.procStatus.id)
		const trackedStatusFilter = playerFilter.status(oneOf(trackedProcStatusIds))
		this.addEventHook(trackedStatusFilter.type('statusApply'), this.onProcGained)
		this.addEventHook(trackedStatusFilter.type('statusRemove'), this.onProcRemoved)

		this.addEventHook('complete', this.onComplete)

		if (this.showProcTimelineRow) {
			this.row = this.timeline.addRow(new SimpleRow({
				label: this.ProcGroupLabel,
				collapse: true,
				order: 0,
			}))
		}

		this.trackedProcs.forEach(group => {
			this.history.set(group, [])
		})
	}

	/**
	 * Checks to see if the event in question consumes the given proc
	 * @param procGroup The proc that may be consumed
	 * @param event The event that may consume the proc
	 * @returns True if the event consumes the proc, false if it does not
	 */
	private checkConsumeProc(procGroup: ProcGroup, event: Events['action']): boolean {
		// If we don't currently have this proc active, we can't possibly consume it
		if (!this.currentWindows.has(procGroup)) { return false }
		const action = this.data.getAction(event.action)
		// If we have no idea what this action is, it doesn't consume it
		if (action == null) { return false }
		// If we're in downtime, we don't consume procs (don't credit using an AoE-around-self Proc during downtime)
		if (this.downtime.isDowntime(event.timestamp)) { return false }

		// If we pass the error checks, return the value from jobSpecificCheckConsumeProc
		// Subclasses can assume the basic error handling is dealt with and focus on only the job-specific logic
		return procGroup.consumeActions.includes(action) && this.jobSpecificCheckConsumeProc(procGroup, event)
	}

	/**
	 * May be overridden by subclasses. Called by onCast to allow jobs to add specific logic that determines whether a proc was consumed
	 * @param _procGroup The procGroup to check for consumption
	 * @param _event The event to check
	 */
	protected jobSpecificCheckConsumeProc(_procGroup: ProcGroup, _event: Events['action']): boolean {
		return true
	}

	/**
	 * May be overridden by subclasses. Called by onCast to allow jobs to add specific handlers for a consumed proc
	 * @param _procGroup The procGroup to add consumption handling for
	 * @param _event The event triggering a proc consumption
	*/
	protected jobSpecificOnConsumeProc(_procGroup: ProcGroup, _event: Events['action']): void { /* */ }

	/**
	 * May be overriden by Subclasses. Called by OnProcGained to allow jobs to implment job-specific logic for evaluting a proc when it is gained
	 * @param event The event to check
	 * @returns True by default. Jobs may override to return false, allowing them to implement job-specific logic to ignore a proc gain
	 */
	protected jobSpecificOnProcGainedConsiderEvent(_event: Events['statusApply']): boolean { return true }
	/**
	 * May be overridden by subclasses. Called by onCast to determine whether the action in question can consume
	 * multiple procs from a single event.
	 * @param _action The action that might consume multiple procs
	 * @returns False by default. Jobs may override to return true, allowing usages to be registered for more than one proc status from the event
	 */
	protected actionMayConsumeAdditionalProcs(_action: number): boolean {
		return false
	}

	private onCast(event: Events['action']): void {
		for (const activeProc of this.currentWindows.keys()) {
			// If this action consumed a proc, log it
			if (this.checkConsumeProc(activeProc, event)) {
				if (this.invulnerability.isActive({
					timestamp: event.timestamp,
					actorFilter: actor => actor.id === event.target,
					types: ['invulnerable'],
				})) {
					this.currentWindows.get(activeProc)?.consumingInvulnEvents.push(event)
				} else {
					this.currentWindows.get(activeProc)?.consumingEvents.push(event)
				}

				this.jobSpecificOnConsumeProc(activeProc, event)

				if (!this.actionMayConsumeAdditionalProcs(event.action)) {
					break // Get out of the loop if we only consume one proc status at a time
				}
			} else {
				this.currentWindows.get(activeProc)?.nonConsumingEvents.push(event)
			}
		}
	}

	private onProcGained(event: Events['statusApply']): void {
		const procGroup = this.getTrackedGroupByStatus(event.status)

		if (!this.jobSpecificOnProcGainedConsiderEvent(event)) { return }
		if (procGroup == null) { return }

		if (procGroup.procStatus.stacksApplied != null && event.data != null && event.data < procGroup.procStatus.stacksApplied) {
			// Only consider apply events for statuses with stacks when they're the max number of stacks - we get reapply events for each reduced stack count as the status is consumed
			return
		}

		if (this.currentWindows.has(procGroup)) {
			// Close this window and open a fresh one so the timeline shows the re-applications correctly
			this.stopAndSave(procGroup, 'overwrite', event)
		}

		this.currentWindows.set(procGroup, {
			start: event.timestamp,
			consumingEvents: [],
			consumingInvulnEvents: [],
			nonConsumingEvents: [],
			overwritten: false,
		})
	}

	private onProcRemoved(event: Events['statusRemove']): void {
		const procGroup = this.getTrackedGroupByStatus(event.status)

		if (procGroup == null) { return }

		this.stopAndSave(procGroup, 'removal', event)
	}

	/**
	 * May be overridden by subclasses. Called in onComplete to override the default icon for the dropped procs suggestion,
	 * if there is job-specific logic for picking the right one
	 */
	protected overrideDroppedProcsIcon(): void { /* no op */ }

	/**
	 * May be overridden by subclasses. Called in onComplete to override the default icon for the overwrote procs suggestion,
	 * if there is job-specific logic for picking the right one
	 */
	protected overrideOverwroteProcsIcon(): void { /* no op */ }

	/**
	 * May be overridden by subclasses. Called in onComplete to override the default icon for the invuln procs suggestion,
	 * if there is job-specific logic for picking the right one
	 */
	protected overrideInvulnProcsIcon(): void { /* no op */ }

	/**
	 * May be overridden by subclasses. Called in onComplete to set the 'why' component of the dropped procs suggestion after the value for the plural
	 * has been calculated
	 */
	protected overrideDroppedProcsWhy(): void {
		this.droppedProcWhy = <Trans id="core.procs.suggestions.dropped.why">You dropped <Plural value={this.droppedProcs} one="# proc" other="# procs" />.</Trans>
	}

	/**
	* May be overridden by subclasses. Called in onComplete to set the 'why' component of the overwrote procs suggestion after the value for the plural
	* has been calculated
	*/
	protected overrideOverwroteProcsWhy(): void {
		this.overwroteProcWhy = <Trans id="core.procs.suggestions.overwrote.why">You overwrote <Plural value={this.overwrittenProcs} one="# proc" other="# procs" />.</Trans>
	}

	/**
	* May be overridden by subclasses. Called in onComplete to set the 'why' component of the invuln procs suggestion after the value for the plural
	* has been calculated
	*/
	protected overrideInvulnProcsWhy(): void {
		this.invulnProcWhy = <Trans id="core.procs.suggestions.invuln.why">You used <Plural value={this.invulnUsages} one="# proc" other="# procs" /> on an invulnerable target.</Trans>
	}

	/**
	 * May be overridden by subclasses. Called in onComplete to add any job-specific suggestions above and beyond the core suggestions
	 */
	protected addJobSpecificSuggestions(): void { /* no op */ }

	private onComplete(): void {
		this.trackedProcs.forEach(procGroup => {
			const status = procGroup.procStatus
			if (status == null) { return }

			const fightStart = this.parser.pull.timestamp
			// Finalise the buff if it was still active, shouldn't be counted as dropped or overwritten
			this.stopAndSave(procGroup, 'endoffight')

			// Add buff windows to the timeline
			if (this.showProcTimelineRow) {
				const row = this.getRowForStatus(status)
				this.history.get(procGroup)?.forEach(window => {
					if (window.stop == null) { return }
					row.addItem(new StatusItem({
						status,
						start: window.start - fightStart,
						end: window.stop - fightStart,
					}))
				})
			}
		})

		// Dropped Procs
		if (this.showDroppedProcSuggestion) {
			this.trackedProcs.forEach(procGroup => this.droppedProcs += this.getDropCountForStatus(procGroup.procStatus.id))
			this.overrideDroppedProcsIcon()
			this.overrideDroppedProcsWhy()
			this.suggestions.add(new TieredSuggestion({
				icon: this.droppedProcIcon,
				content: this.droppedProcContent,
				why: this.droppedProcWhy,
				tiers: this.droppedProcSeverityTiers,
				value: this.droppedProcs,
			}))
		}

		// Overwritten Procs
		if (this.showOverwroteProcSuggestion) {
			this.trackedProcs.forEach(procGroup => this.overwrittenProcs += this.getOverwriteCountForStatus(procGroup.procStatus.id))
			this.overrideOverwroteProcsIcon()
			this.overrideOverwroteProcsWhy()
			this.suggestions.add(new TieredSuggestion({
				icon: this.overwroteProcIcon,
				content: this.overwroteProcContent,
				why: this.overwroteProcWhy,
				tiers: this.overwroteProcSeverityTiers,
				value: this.overwrittenProcs,
			}))
		}

		// Procs used on invulnerable enemies
		if (this.showInvulnProcSuggestion) {
			this.trackedProcs.forEach(procGroup => this.invulnUsages += this.getInvulnCountForStatus(procGroup.procStatus.id))
			this.overrideInvulnProcsIcon()
			this.overrideInvulnProcsWhy()
			this.suggestions.add(new TieredSuggestion({
				icon: this.invulnProcIcon,
				content: this.invulnProcContent,
				why: this.invulnProcWhy,
				tiers: this.invulnProcSeverityTiers,
				value: this.invulnUsages,
			}))
		}

		this.addJobSpecificSuggestions()
	}

	private stopAndSave(procGroup: ProcGroup, endReason: WindowEndReason, event?: Event): void {
		const currentWindow = this.currentWindows.get(procGroup)
		if (currentWindow == null) { return }

		currentWindow.overwritten = endReason === 'overwrite'
		if (endReason === 'overwrite' && event != null) {
			currentWindow.overwriteEvent = event
		}

		const stop = event?.timestamp ?? this.parser.pull.timestamp + this.parser.pull.duration
		this.history.get(procGroup)?.push({
			...currentWindow,
			stop,
		})
		this.currentWindows.delete(procGroup)
	}

	/** Gets the row for a given status, creating it if necessary. Public so Sharpcast can access it */
	public getRowForStatus(status: Status): SimpleRow {
		let row = this.rows.get(status.id)
		if (row == null) {
			row = this.row.addRow(new SimpleRow({label: status.name}))
			this.rows.set(status.id, row)
		}
		return row
	}

	protected getTrackedGroupByStatus(status: number | ProcGroup): ProcGroup | undefined {
		return typeof status === 'number' ? this.trackedProcs.find(group => group.procStatus.id === status) : status
	}

	protected getTrackedGroupsByAction(actionId: number): ProcGroup[] {
		return this.trackedProcs.filter(group => group.consumeActions.find(action => action.id === actionId) != null)
	}

	private relativeTimestamp(timestamp: number) {
		if (timestamp < this.parser.pull.timestamp) { return this.parser.pull.timestamp }
		const relativeTimestamp = timestamp - this.parser.pull.timestamp
		if (relativeTimestamp > this.parser.pull.duration) { return this.parser.pull.duration }

		return timestamp - this.parser.pull.timestamp
	}

	private getProcIssueLabel(issue: ProcIssues) {
		switch (issue.type) {
		case 'dropped':
			return <Trans id="core.ui.procs-table.issue.dropped">Dropped</Trans>
		case 'overwritten':
			return <Trans id="core.ui.procs-table.issue.overwrite">Overwritten</Trans>
		case 'invuln':
			return <Trans id="core.ui.procs-table.issue.invuln">Invulnerable</Trans>
		default:
			return <Trans id="core.ui.procs-table.issue.unknown">Unknown</Trans>
		}
	}

	override output() {
		if (!this.showProcIssueOutput) { return null }

		const procIssues = this.getDisplayedProcIssues()
		if (procIssues.length === 0) { return null }

		return <>
			{
				this.procOutputHeader ?
					<Message>{this.procOutputHeader}</Message> :
					<></>
			}
			<Table compact unstackable celled collapsing>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell collapsing>
							<strong><Trans id="core.ui.procs-table.header.time">Time</Trans></strong>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<strong><Trans id="core.ui.procs-table.header.which-proc">Proc Status</Trans></strong>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<strong><Trans id="core.ui.procs-table.header.issue">Issue</Trans></strong>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{
						procIssues.map(window => {

							return <Table.Row key={window.timestamp}>
								<Table.Cell style={{whiteSpace: 'center'}}>
									<span>{this.parser.formatEpochTimestamp(window.timestamp, 0)}</span>
									<Button style={{marginLeft: 5}}
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(this.relativeTimestamp(window.timestamp - TIMELINE_CONTEXT_DURATION), this.relativeTimestamp(window.timestamp + TIMELINE_CONTEXT_DURATION))}
									/>
								</Table.Cell>
								<Table.Cell>
									<StatusLink {...window.status} />
								</Table.Cell>
								<Table.Cell>
									{this.getProcIssueLabel(window)}
								</Table.Cell>
							</Table.Row>
						})
					}
				</Table.Body>
			</Table>
		</>
	}
}
