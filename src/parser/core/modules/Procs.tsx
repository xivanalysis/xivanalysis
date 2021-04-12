import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Actors} from 'parser/core/modules/Actors'
// import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {SimpleRow, StatusItem, Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Analyser} from '../Analyser'
import {filter, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {Data} from './Data'

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

type ProcErrorType =
	| 'overwrite'
	| 'drop'

const DEFAULT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}
export abstract class Procs extends Analyser {
	static handle = 'procs'
	static title = t('core.procs.title')`Procs`

	// @dependency private downtime!: Downtime
	@dependency protected suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency protected actors!: Actors
	@dependency protected data!: Data

	private droppedProcs: number = 0
	private overwrittenProcs: number = 0
	private invulnUsages: number = 0

	/**
	 * Implementing analysers must provide a list of tracked procs
	 */
	protected abstract trackedProcs: ProcGroup[]

	// Subclassing modules may override these suggestion properties with relevant job-specific ones
	protected showDroppedProcSuggestion: boolean = false
	protected droppedProcIcon: string = 'https://xivapi.com/i/001000/001989.png' // Hasty Touch ...
	protected droppedProcContent: JSX.Element | string = <Trans id="core.procs.suggestions.dropped.content">Avoid letting your procs fall off without using them. Proc actions are generally stronger than other actions and should not be wasted.</Trans>
	protected droppedProcSeverityTiers = DEFAULT_SEVERITY_TIERS

	protected showOverwroteProcSuggestion: boolean = false
	protected overwroteProcIcon: string = 'https://xivapi.com/i/001000/001994.png' // Muscle Memory ...
	protected overwroteProcContent: JSX.Element | string = <Trans id="core.procs.suggestions.overwritten.content">Avoid using an action that could generate a proc when you already have that proc active.</Trans>
	protected overwroteProcSeverityTiers = DEFAULT_SEVERITY_TIERS

	protected showInvulnProcSuggestion: boolean = false
	protected invulnProcIcon: string = this.data.actions.HALLOWED_GROUND.icon // lol
	protected invulnProcContent: JSX.Element | string = <Trans id="core.procs.suggestions.invuln.content">Try not to use your procs while the boss is invulnerable.</Trans>
	protected invulnProcSeverityTiers = DEFAULT_SEVERITY_TIERS

	/**
	 * Subclassing analysers should not assign these directly. The corresponding override functions should be used instead to ensure that the
	 * variables needed for the Plurals typically used in suggestion Whys are ready for setting into the object
	 */
	protected droppedProcWhy!: JSX.Element | string
	protected overwroteProcWhy!: JSX.Element | string
	protected invulnProcWhy!: JSX.Element | string

	private usages = new Map<ProcGroup, Event[]>()
	protected getUsagesForStatus(status: number | ProcGroup): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup === undefined) { return [] }
		return this.usages.get(procGroup) || []
	}
	private overWrites = new Map<ProcGroup, Event[]>()
	protected getOverwritesForStatus(status: number): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup === undefined) { return [] }
		return this.overWrites.get(procGroup) || []
	}
	private drops = new Map<ProcGroup, Event[]>()
	protected getDropsForStatus(status: number): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup === undefined) { return [] }
		return this.drops.get(procGroup) || []
	}
	private invulns = new Map<ProcGroup, Event[]>()
	protected getInvulnsForStatus(status: number): Event[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup === undefined) { return [] }
		return this.invulns.get(procGroup) || []
	}

	private currentWindows = new Map<ProcGroup, ProcBuffWindow>()
	private history = new Map<ProcGroup, ProcBuffWindow[]>()
	protected getHistoryForStatus(status: number): ProcBuffWindow[] {
		const procGroup = this.getTrackedGroupByStatus(status)
		if (procGroup === undefined) { return [] }
		return this.history.get(procGroup) || []
	}

	private row!: SimpleRow
	private rows = new Map()

	protected castingSpellId: number | null = null
	protected lastCastingSpellId: number | null = null

	initialise() {
		this.addEventHook(filter<Event>().type('prepare').source(this.parser.actor.id), this.onPrepare)

		const trackedProcActionsIds: number[] = this.trackedProcs.map(group => group.consumeActions).reduce((acc, cur) => acc.concat(cur)).map(action => action.id)
		const trackedActionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.action(oneOf(trackedProcActionsIds))
		this.addEventHook(trackedActionFilter.type('action'), this.onCast)

		const trackedProcStatusIds: number[] = this.trackedProcs.map(group => group.procStatus.id)
		const trackedStatusFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(oneOf(trackedProcStatusIds))
		this.addEventHook(trackedStatusFilter.type('statusApply'), this.onProcGained)
		this.addEventHook(trackedStatusFilter.type('statusRemove'), this.onProcRemoved)

		this.addEventHook('complete', this.onComplete)

		this.row = this.timeline.addRow(new SimpleRow({
			label: 'Procs Core',
			order: 0,
		}))

		this.trackedProcs.forEach(group => {
			this.usages.set(group, [])
			this.overWrites.set(group, [])
			this.drops.set(group, [])
			this.invulns.set(group, [])
			this.history.set(group, [])
		})
	}

	private onPrepare(event: Events['prepare']): void {
		this.castingSpellId = event.action
	}

	/**
	 * May be overridden by subclasses. Called by onCast to allow jobs to add specific logic that determines whether a proc was consumed
	 * @param _event
	 */
	protected jobSpecificCheckConsumeProc(_procGroup: ProcGroup, _event: Events['action']): boolean {
		return true
	}

	/** May be overridden by subclasses. Called by onCast to allow jobs to add specific handlers for a consumed proc */
	protected jobSpecificOnConsumeProc(_procGroup: ProcGroup, _event: Events['action']): void { /* */ }

	private onCast(event: Events['action']): void {
		const procGroup: ProcGroup | undefined = this.getTrackedGroupByAction(event.action)
		this.lastCastingSpellId = this.castingSpellId
		this.castingSpellId = null

		if (procGroup === undefined) { return }
		if (!this.currentWindows.has(procGroup)) { return }

		const action = this.data.getAction(event.action)
		if (action === undefined) { return }

		// If there is job-specific logic that needs to be run to decide if a proc is being used, do that now
		if (!this.jobSpecificCheckConsumeProc(procGroup, event)) { return }

		// TODO: need downtime on Analyser system
		// if (!this.downtime.isDowntime(event.timestamp)) {
		this.usages.get(procGroup)?.push(event)
		// }

		// TODO: Need Invulnerability on Analyser system
		// If the target of the cast was invulnerable, push event to invulns
		/* if (this.invuln.isInvulnerable(event.target, event.timestamp)) {
			this.invulns.get(procGroup)?.push(event)
		}*/

		this.stopAndSave(procGroup, event)

		this.jobSpecificOnConsumeProc(procGroup, event)
	}

	private onProcGained(event: Events['statusApply']): void {
		const procGroup: ProcGroup | undefined = this.getTrackedGroupByStatus(event.status)

		if (procGroup === undefined) {
			return
		}

		if (this.currentWindows.has(procGroup)) {
			// Close this window and open a fresh one so the timeline shows the re-applications correctly
			this.stopAndSave(procGroup, event, 'overwrite')
		}
		this.currentWindows.set(procGroup, {
			start: event.timestamp,
		})
	}

	private onProcRemoved(event: Events['statusRemove']): void {
		const procGroup: ProcGroup | undefined = this.getTrackedGroupByStatus(event.status)

		if (procGroup === undefined) {
			return
		}

		this.stopAndSave(procGroup, event, 'drop')
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
		this.overwroteProcWhy = <Trans id="core.procs.suggestions.overwrote.why">You overwrote <Plural value={this.overwrittenProcs} one="# proc" other="# procs" /></Trans>
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
			if (status === undefined) {
				return
			}

			const row = this.getRowForStatus(status)
			const fightStart = this.parser.pull.timestamp
			// Finalise the buff if it was still active, shouldn't be counted as dropped or overwritten
			this.stopAndSave(procGroup)

			// Add buff windows to the timeline
			this.history.get(procGroup)?.forEach(window => {
				if (window.stop === undefined) {
					return
				}
				row.addItem(new StatusItem({
					status,
					start: window.start - fightStart,
					end: window.stop - fightStart,
				}))
			})
		})

		// Dropped Procs
		if (this.showDroppedProcSuggestion) {
			this.drops.forEach(drops => this.droppedProcs += drops.length)
			this.usages.forEach(useage => this.droppedProcs -= useage.length)
			this.droppedProcs = Math.max(this.droppedProcs, 0)
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
			this.overWrites.forEach(overwrites => this.overwrittenProcs += overwrites.length)
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
			this.invulns.forEach(invulns => this.invulnUsages += invulns.length)
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

	private stopAndSave(procGroup: ProcGroup, event?: Event, type?: ProcErrorType): void {
		// The player dropped the proc if it fell off during uptime, while they were alive, and it wasn't overwritten by a new instance
		if (event && type === 'drop' && !(/* this.downtime.isDowntime(event.timestamp) || */ this.actors.current.hp.current === 0)) {
			this.drops.get(procGroup)?.push(event)
		}

		// If this was an overwrite event, and overwrites are disallowed for this proc, save a record of that
		if (event && type === 'overwrite' && !procGroup.mayOverwrite) {
			this.overWrites.get(procGroup)?.push(event)
		}

		if (!this.currentWindows.has(procGroup)) { return }

		const currentWindow = this.currentWindows.get(procGroup)
		if (currentWindow === undefined) { return }

		currentWindow.stop = event?.timestamp ?? this.parser.pull.timestamp + this.parser.pull.duration
		this.history.get(procGroup)?.push(currentWindow)
		this.currentWindows.delete(procGroup)
	}

	private getRowForStatus(status: Status): SimpleRow {
		let row = this.rows.get(status.id)
		if (row === undefined) {
			row = this.row.addRow(new SimpleRow({label: status.name}))
			this.rows.set(status.id, row)
		}
		return row
	}

	protected getTrackedGroupByStatus(status: number | ProcGroup): ProcGroup | undefined {
		return typeof status === 'number' ? this.trackedProcs.find(group => group.procStatus.id === status) : status
	}

	protected getTrackedGroupByAction(actionId: number): ProcGroup | undefined {
		return this.trackedProcs.find(group => group.consumeActions.find(action => action.id === actionId) !== undefined)
	}
}
