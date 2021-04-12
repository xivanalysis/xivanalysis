import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {CastEvent} from 'fflogs'
import _ from 'lodash'
import {ProcGroup, Procs} from 'parser/core/modules/Procs'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

declare module 'event' {
	interface FieldsTargeted {
		overrideAction?: number
	}
}

export default class BLMProcs extends Procs {
	trackedProcs = [
		{
			procStatus: this.data.statuses.THUNDERCLOUD,
			consumeActions: [
				this.data.actions.THUNDER,
				this.data.actions.THUNDER_II,
				this.data.actions.THUNDER_III,
				this.data.actions.THUNDER_IV,
			],
		},
		{
			procStatus: this.data.statuses.FIRESTARTER,
			consumeActions: [this.data.actions.FIRE_III],
		},
	]

	private actionProcs: Map<number, number> = new Map([
		[this.data.actions.THUNDER_III.id, this.data.actions.THUNDER_III_PROC.id],
		[this.data.actions.THUNDER_IV.id, this.data.actions.THUNDER_IV_PROC.id],
		[this.data.actions.FIRE_III.id, this.data.actions.FIRE_III_PROC.id],
	])

	public checkProc(event: Event, statusId: number): boolean {
		const procHistory = this.getHistoryForStatus(statusId)
		if (procHistory.length === 0) { return false }

		const lastHistoryEntry = _.last(procHistory)?.stop || 0
		return event.timeStamp === lastHistoryEntry
	}

	/** @deprecated */
	public checkProcLegacy(event: CastEvent, statusId: number) : boolean {
		const procHistory = this.getHistoryForStatus(statusId)
		if (procHistory.length === 0) { return false }
		const lastHistoryEntry = _.last(procHistory)?.stop || 0
		return event.timestamp === this.parser.epochToFflogs(lastHistoryEntry)
	}

	protected jobSpecificCheckConsumeProc(_procGroup: ProcGroup, event: Events['action']): boolean {
		const action = this.data.getAction(event.action)
		if (action === undefined) { return false } // If we don't know what action this is, it didn't consume a proc
		if (!action.castTime) { return false } // BLM's procs spells all have cast times, so if this action doesn't have a cast time, it's not a proc
		if (this.lastCastingSpellId && this.lastCastingSpellId === action.id) { return false } // If this spell was hardcast, it's not a proc
		return true // otherwise, it's a proc
	}

	protected jobSpecificOnConsumeProc(_procGroup: ProcGroup, event: Events['action']): void {
		// TODO: castTime needs to be on Analyser
		// this.castTime.set([actionId], 0, event.timestamp, event.timestamp)
		const actionProcId = this.actionProcs.get(event.action)
		if (actionProcId !== undefined) {
			event.overrideAction = actionProcId
		}
		return
	}

	protected addJobSpecificSuggestions(): void {
		const droppedThunderClouds: number = this.getDropsForStatus(this.data.statuses.THUNDERCLOUD.id).length -
			this.getUsagesForStatus(this.data.statuses.THUNDERCLOUD.id).length
		if (droppedThunderClouds > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.THUNDER_III_PROC.icon,
				content: <Trans id="blm.procs.suggestions.dropped-t3ps.content">
					You lost at least one <ActionLink {...this.data.actions.THUNDER_III}/> proc by allowing <StatusLink {...this.data.statuses.THUNDERCLOUD}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-t3ps.why">
					<Plural value={droppedThunderClouds} one="# Thundercloud proc" other="# Thundercloud procs" /> expired.
				</Trans>,
			}))
		}

		const droppedFireStarters: number = this.getDropsForStatus(this.data.statuses.FIRESTARTER.id).length -
			this.getUsagesForStatus(this.data.statuses.FIRESTARTER.id).length
		if (droppedFireStarters > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FIRE_III_PROC.icon,
				content: <Trans id="blm.procs.suggestions.dropped-f3ps.content">
					You lost at least  one <ActionLink {...this.data.actions.FIRE_III}/> proc by allowing <StatusLink {...this.data.statuses.FIRESTARTER}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-f3ps.why">
					<Plural value={droppedFireStarters} one="# Firestarter proc" other="# Firestarter procs" /> expired.
				</Trans>,
			}))
		}
	}
}
