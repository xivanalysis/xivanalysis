import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {Action} from 'data/ACTIONS'
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

interface ProcBuffWindow {
	start: number,
	stop?: number
}

interface ProcGroup {
	procStatus: Status,
	consumeActions: Action[],
	mayOverwrite?: boolean,
	procsBecomeInstant?: boolean,
}

export abstract class Procs extends Analyser {
	static handle = 'procs'
	static title = t('core.procs.title')`Procs`

	// @dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private actors!: Actors
	@dependency private data!: Data

	/**
	 * Implementing analysers must provide a list of tracked procs
	 */
	protected abstract trackedProcs: ProcGroup[]

	// Subclassing modules should override these icons with relevant job-specific ones
	static droppedProcIcon: string
	static overwroteProcIcon: string
	static invulnProcIcon: string

	private usages = new Map<ProcGroup, Event[]>()
	private overWrites = new Map<ProcGroup, Event[]>()
	private drops = new Map<ProcGroup, Event[]>()
	private invulns = new Map<ProcGroup, Event[]>()

	private currentWindows = new Map<ProcGroup, ProcBuffWindow>()
	private history = new Map<ProcGroup, ProcBuffWindow[]>()

	private row!: SimpleRow
	private rows = new Map()

	private castingSpellId: number | null = null

	protected init() {
		this.addEventHook('prepare', this.onPrepare)

		const trackedProcActionsIds: number[] = this.trackedProcs.map(group => group.consumeActions).reduce((acc, cur) => acc.concat(cur)).map(action => action.id)
		const trackedActionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.action(oneOf(...trackedProcActionsIds))
		this.addEventHook(trackedActionFilter.type('action'), this.onCast)

		const trackedProcStatusIds: number[] = this.trackedProcs.map(group => group.procStatus.id)
		const trackedStatusFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(oneOf(...trackedProcStatusIds))
		this.addEventHook(trackedStatusFilter.type('statusApply'), this.onProcGained)
		this.addEventHook(trackedStatusFilter.type('statusRemove'), this.onProcRemoved)

		this.addEventHook('complete', this.onComplete)

		this.row = this.timeline.addRow(new SimpleRow({
			label: 'Procs',
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

	private onCast(event: Events['action']): void {
		const procGroup: ProcGroup | undefined = this.getTrackedGroupByAction(event.action)
		const lastCastingSpellId = this.castingSpellId
		this.castingSpellId = null

		if (procGroup === undefined) { return }
		if (!this.currentWindows.has(procGroup)) { return }

		const action = this.data.getAction(event.action)
		if (action === undefined) { return }

		// If procced version of the action are always instant cast, but we detect that this cast event was a hardcast, don't consume the proc
		if (procGroup.procsBecomeInstant && action.castTime && lastCastingSpellId && lastCastingSpellId === action.id) { return }

		// if (!this.downtime.isDowntime(event.timestamp)) {
		this.usages.get(procGroup)?.push(event)
		// }

		// TODO: If the target of the cast was invulnerable, push event to invulns
		this.stopAndSave(procGroup, event)

		// TODO: Handle BLM's castTime set to 0 and overrideAction nonsense
	}

	private onProcGained(event: Events['statusApply']): void {
		const procGroup: ProcGroup | undefined = this.getTrackedGroupByStatus(event.status)

		if (procGroup === undefined) {
			return
		}

		if (this.currentWindows.has(procGroup)) {
			// Close this window and open a fresh one so the timeline shows the re-applications correctly
			this.stopAndSave(procGroup, event, true)
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

		this.stopAndSave(procGroup, event)
	}

	protected onComplete(event: Events['complete']): void {
		let droppedProcs = 0
		this.drops.forEach(drops => droppedProcs += drops.length)
		this.usages.forEach(useage => droppedProcs -= useage.length)
		droppedProcs = Math.max(droppedProcs, 0)
		this.suggestions.add(new TieredSuggestion({ //dropped procs
			icon: (this.constructor as typeof Procs).droppedProcIcon,
			content: <Trans id="dnc.procs.suggestions.drops.content">
				Avoid dropping your procs unless absolutely necessary. If you have to drop one to keep your Esprit from overcapping, <ActionLink {...ACTIONS.RISING_WINDMILL} /> or <ActionLink {...ACTIONS.REVERSE_CASCADE} /> will lose the least DPS overall.
			</Trans>,
			why: <Trans id="dnc.procs.suggestions.drops.why">
				You dropped <Plural value={droppedProcs} one="# proc" other="# procs"/>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: droppedProcs,
		}))

		let overwrittenProcs = 0
		this.overWrites.forEach(overwrites => overwrittenProcs += overwrites.length)
		this.suggestions.add(new TieredSuggestion({ //overriding
			icon: (this.constructor as typeof Procs).overwroteProcIcon,
			content: <Trans id="dnc.procs.suggestions.overwrite.content">
				Avoid overwriting your procs. Your proc actions are stronger than your normal combo, so overwriting them is a significant DPS loss.
			</Trans>,
			why: <Trans id="dnc.procs.suggestions.overwrite.why">
				You overwrote <Plural value={overwrittenProcs} one="# proc" other="# procs"/>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: overwrittenProcs,
		}))

		this.trackedProcs.forEach(procGroup => {
			const status = procGroup.procStatus
			if (status === undefined) {
				return
			}

			const row = this.getRowForStatus(status)
			const fightStart = this.parser.pull.timestamp

			// Finalise the buff if it was still active
			if (this.currentWindows.has(procGroup)) {
				this.stopAndSave(procGroup, event)
			}

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
	}

	private stopAndSave(procGroup: ProcGroup, event: Event, overwrite: boolean = false): void {
		// The player dropped the proc if it fell off during uptime, while they were alive, and it wasn't overwritten by a new instance
		if (!(/* this.downtime.isDowntime(event.timestamp) || */ this.actors.current.hp.current === 0 || overwrite)) {
			this.drops.get(procGroup)?.push(event)
		}

		// If this was an overwrite event, and overwrites are disallowed for this proc, save a record of that
		if (overwrite && !procGroup.mayOverwrite) {
			this.overWrites.get(procGroup)?.push(event)
		}

		if (!this.currentWindows.has(procGroup)) { return }

		const currentWindow = this.currentWindows.get(procGroup)
		if (currentWindow === undefined) { return }

		currentWindow.stop = event.timestamp
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

	private getTrackedGroupByStatus(statusId: number): ProcGroup | undefined {
		return this.trackedProcs.find(group => group.procStatus.id === statusId)
	}

	private getTrackedGroupByAction(actionId: number): ProcGroup | undefined {
		return this.trackedProcs.find(group => group.consumeActions.find(action => action.id === actionId) !== undefined)
	}
}
