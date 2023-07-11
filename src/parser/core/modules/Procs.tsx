import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Actors} from 'parser/core/modules/Actors'
import Suggestions, {TieredSuggestion, SEVERITY, SeverityTiers} from 'parser/core/modules/Suggestions'
import {SimpleRow, StatusItem, Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Analyser} from '../Analyser'
import {filter, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {Data} from './Data'
import Downtime from './Downtime'
import {Invulnerability} from './Invulnerability'

export interface ProcBuffWindow {
	start: number,
	stop?: number
}

export interface ProcGroup {
	procStatus: Status,
	consumeActions: Action[],
	mayOverwrite?: boolean,
	procsBecomeInstant?: boolean,
}

export interface ProcGroupEvents {
	timestamps: number[],
	events: Event[]
}

type ProcStatusEventType =
	| 'overwrite'
	| 'removal'
	| 'usage'

const DEFAULT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}
export abstract class Procs extends Analyser {
	static override handle = 'procs'
	static override title = t('core.procs.title')`Procs`

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
	protected droppedProcIcon: string = 'https://xivapi.com/i/001000/001989.png' // Hasty Touch ...
	protected droppedProcContent: ReactNode = <Trans id="core.procs.suggestions.dropped.content">Avoid letting your procs fall off without using them. Proc actions are generally stronger than other actions and should not be wasted.</Trans>
	protected droppedProcSeverityTiers: SeverityTiers = DEFAULT_SEVERITY_TIERS

	protected showOverwroteProcSuggestion: boolean = false
	protected overwroteProcIcon: string = 'https://xivapi.com/i/001000/001994.png' // Muscle Memory ...
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

	/**
	 * Subclassing analysers should not assign these directly. The corresponding override functions should be used instead to ensure that the
	 * variables needed for the Plurals typically used in suggestion Whys are ready for setting into the object
	 */
	protected droppedProcWhy!: ReactNode
	protected overwroteProcWhy!: ReactNode
	protected invulnProcWhy!: ReactNode

	private usages = new Map<ProcGroup, ProcGroupEvents>()
	/**
	 * Get an array of usage events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of usage Events
	 */
	protected getUsagesForStatus(status: number | ProcGroup): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.usages.get(procGroup)?.events || []
	}
	/**
	 * Get the number of times a proc was used
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was used
	 */
	protected getUsageCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.usages.get(procGroup)?.events.length || 0
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
	private checkActionWasProc(actionId: number, timestamp: number): boolean {
		const procGroups = this.getTrackedGroupsByAction(actionId)
		if (procGroups.length === 0) { return false }
		let wasProc = false
		for (const procGroup of procGroups) {
			wasProc = wasProc || this.getUsagesForStatus(procGroup).some(event => event.timestamp === timestamp)
		}
		return wasProc
	}

	private overwrites = new Map<ProcGroup, ProcGroupEvents>()
	/**
	 * Get an array of overwrite events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of overwrite Events
	 */
	protected getOverwritesForStatus(status: number | ProcGroup): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.overwrites.get(procGroup)?.events || []
	}
	/**
	 * Get the number of times a proc was overwritten
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was overwritten
	 */
	protected getOverwriteCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.overwrites.get(procGroup)?.events.length || 0
	}

	private removals = new Map<ProcGroup, ProcGroupEvents>()
	/**
	 * Get an array of removal events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of removal Events
	 */
	protected getRemovalsForStatus(status: number | ProcGroup): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.removals.get(procGroup)?.events || []
	}
	/**
	 * Get the number of times a proc was removed
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was removed
	 */
	protected getRemovalCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.removals.get(procGroup)?.events.length || 0
	}

	private invulns = new Map<ProcGroup, ProcGroupEvents>()
	/**
	 * Get an array of invulnerable usage events for a given proc status
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The array of invulnerable usage Events
	 */
	protected getInvulnsForStatus(status: number | ProcGroup): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return [] }
		return this.invulns.get(procGroup)?.events || []
	}
	/**
	 * Get the number of times a proc was used on an invulnerable target
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was used on an invulnerable target
	 */
	protected getInvulnCountForStatus(status: number | ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.invulns.get(procGroup)?.events.length || 0
	}

	/**
	 * Gets the number of times a proc was allowed to fall off
	 * @param status The status, as an ID number or ProcGroup object
	 * @returns The number of times the proc was dropped (removals - usages)
	 */
	protected getDropCountForStatus(status: number| ProcGroup): number {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup == null) { return 0 }
		return this.getRemovalCountForStatus(status) - this.getUsageCountForStatus(status)
	}

	private currentWindows = new Map<ProcGroup, ProcBuffWindow>()
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

	protected castingSpellId?: number

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('prepare'), this.onPrepare)
		this.addEventHook(playerFilter.type('interrupt'), this.onInterrupt)

		const trackedProcActionsIds: number[] = this.trackedProcs.map(group => group.consumeActions).reduce((acc, cur) => acc.concat(cur)).map(action => action.id)
		const trackedActionFilter = playerFilter.action(oneOf(trackedProcActionsIds))
		this.addEventHook(trackedActionFilter.type('action'), this.onCast)

		const trackedProcStatusIds: number[] = this.trackedProcs.map(group => group.procStatus.id)
		const trackedStatusFilter = playerFilter.status(oneOf(trackedProcStatusIds))
		this.addEventHook(trackedStatusFilter.type('statusApply'), this.onProcGained)
		this.addEventHook(trackedStatusFilter.type('statusRemove'), this.onProcRemoved)

		this.addEventHook('complete', this.onComplete)

		if (this.showProcTimelineRow) {
			this.row = this.timeline.addRow(new SimpleRow({
				label: 'Procs',
				order: 0,
			}))
		}

		this.trackedProcs.forEach(group => {
			this.usages.set(group, {timestamps: [], events: []})
			this.overwrites.set(group, {timestamps: [], events: []})
			this.removals.set(group, {timestamps: [], events: []})
			this.invulns.set(group, {timestamps: [], events: []})
			this.history.set(group, [])
		})
	}

	private onPrepare(event: Events['prepare']): void {
		this.castingSpellId = event.action
	}

	private onInterrupt(_event: Events['interrupt']): void {
		this.castingSpellId = undefined
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
		// If we have no idea what this action is, it doesn't consume it
		if (this.data.getAction(event.action) == null) { return false }

		// If we pass the error checks, return the value from jobSpecificCheckConsumeProc
		// Subclasses can assume the basic error handling is dealt with and focus on only the job-specific logic
		return this.jobSpecificCheckConsumeProc(procGroup, event)
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

	private onCast(event: Events['action']): void {
		const procGroups = this.getTrackedGroupsByAction(event.action)

		for (const procGroup of procGroups) {
			// If this action consumed a proc, log it
			if (this.checkConsumeProc(procGroup, event)) {
				this.stopAndSave(procGroup, event, 'usage')

				this.jobSpecificOnConsumeProc(procGroup, event)
				break // Get out of the loop, we only consume one proc status at a time
			}
		}

		// Reset the variable tracking hardcasts since we just finished casting something
		this.castingSpellId = undefined
	}

	private onProcGained(event: Events['statusApply']): void {
		const procGroup = this.getTrackedGroupByStatus(event.status)

		if (procGroup == null) { return }

		if (this.currentWindows.has(procGroup)) {
			// Close this window and open a fresh one so the timeline shows the re-applications correctly
			this.stopAndSave(procGroup, event, 'overwrite')
		}
		this.currentWindows.set(procGroup, {
			start: event.timestamp,
		})
	}

	private onProcRemoved(event: Events['statusRemove']): void {
		const procGroup = this.getTrackedGroupByStatus(event.status)

		if (procGroup == null) { return }

		this.stopAndSave(procGroup, event, 'removal')
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
			this.stopAndSave(procGroup)

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

	private stopAndSave(procGroup: ProcGroup, event?: Event, type?: ProcStatusEventType): void {

		// Only count usages if the event happens during uptime, you don't get credit for using an AoE-around-self Proc during downtime
		if (event && type === 'usage' && !this.downtime.isDowntime(event.timestamp)) {
			this.tryAddEventToUsages(procGroup, event)

			// If the target of the cast was invulnerable, keep track of that too
			if (this.invulnerability.isActive({
				timestamp: event.timestamp,
				actorFilter: actor => actor.id === (event as Events['action']).target,
				types: ['invulnerable'],
			})) {
				this.tryAddEventToInvulns(procGroup, event)
			}
		}

		// Count removals that occur during uptime, and the player is still alive. Don't need to double-penalize deaths or not having GCD space to use all your procs before a downtime
		if (event && type === 'removal' && !(this.downtime.isDowntime(event.timestamp) || this.actors.current.hp.current === 0)) {
			this.tryAddEventToRemovals(procGroup, event)
		}

		// If this was an overwrite event, and overwrites are disallowed for this proc, save a record of that
		if (event && type === 'overwrite' && !procGroup.mayOverwrite) {
			this.tryAddEventToOverwrites(procGroup, event)
		}

		if (!this.currentWindows.has(procGroup)) { return }

		const currentWindow = this.currentWindows.get(procGroup)
		if (currentWindow == null) { return }

		currentWindow.stop = event?.timestamp ?? this.parser.pull.timestamp + this.parser.pull.duration
		this.history.get(procGroup)?.push(currentWindow)
		this.currentWindows.delete(procGroup)
	}

	/**
	 * Add the event to the usage map for the group, if it's not already present in the group
	*/
	private tryAddEventToUsages(procGroup: ProcGroup, event: Event) {
		this.tryAddEventToMap(this.usages.get(procGroup), event)
	}
	/**
	 * Add the event to the removal map for the group, if it's not already present in the group
	 * This method is protected so subclassing analysers can hook into it
	 * Currently only used by BLM to deal with the interaction between T3P and Sharpcast
	*/
	protected tryAddEventToRemovals(procGroup: ProcGroup, event: Event) {
		this.tryAddEventToMap(this.removals.get(procGroup), event)
	}
	/**
	 * Add the event to the invuln map for the group, if it's not already present in the group
	*/
	private tryAddEventToInvulns(procGroup: ProcGroup, event: Event) {
		this.tryAddEventToMap(this.invulns.get(procGroup), event)
	}
	/**
	 * Add the event to the overwrite map for the group, if it's not already present in the group
	*/
	private tryAddEventToOverwrites(procGroup: ProcGroup, event: Event) {
		this.tryAddEventToMap(this.overwrites.get(procGroup), event)
	}

	/** Checks to see if the specified event timestamp already exists in that map, and if not, adds the event to the collection */
	private tryAddEventToMap(groupEvents: ProcGroupEvents | undefined, event: Event) {
		if (groupEvents == null) { return }
		if (groupEvents.timestamps.includes(event.timestamp)) { return }
		groupEvents.timestamps.push(event.timestamp)
		groupEvents.events.push(event)
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
}
