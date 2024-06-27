import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {ProcGroup, Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import iconF3p from './f3p.png'
import iconT3p from './t3p.png'

export default class Procs extends CoreProcs {
	@dependency castTime!: CastTime

	override trackedProcs = [
		{
			procStatus: this.data.statuses.THUNDERCLOUD,
			consumeActions: [
				this.data.actions.THUNDER_III,
				this.data.actions.THUNDER_IV,
			],
		},
		{
			procStatus: this.data.statuses.FIRESTARTER,
			consumeActions: [this.data.actions.FIRE_III],
		},
	]

	protected override jobSpecificCheckConsumeProc(_procGroup: ProcGroup, event: Events['action']): boolean {
		// If we were already hardcasting this spell, it does not consume the proc
		return !(this.castingSpellId != null && this.castingSpellId === event.action)
	}

	protected override jobSpecificOnConsumeProc(procGroup: ProcGroup, event: Events['action']): void {
		// BLM's procs are all instant-casts
		this.castTime.setInstantCastAdjustment([event.action], event.timestamp, event.timestamp)

		// Thunder procs used while sharpcast is up re-grant the proc status without technically removing it, so we need to forcibly add the 'removal' here to keep the 'dropped' counting correct
		if ((event.action === this.data.actions.THUNDER_III.id || event.action === this.data.actions.THUNDER_IV.id) && this.actors.current.hasStatus(this.data.statuses.SHARPCAST.id)) {
			this.tryAddEventToRemovals(procGroup, event)

			// Make sure a Sharpcasted thunder always results in an open window, in case the log had weird status timing
			if (!this.currentWindows.has(procGroup)) {
				this.currentWindows.set(procGroup, {start: event.timestamp})
			}
		}
	}

	protected override addJobSpecificSuggestions(): void {
		const droppedThunderClouds: number = this.getDropCountForStatus(this.data.statuses.THUNDERCLOUD.id)
		if (droppedThunderClouds > 0) {
			this.suggestions.add(new Suggestion({
				icon: iconT3p,
				content: <Trans id="blm.procs.suggestions.dropped-t3ps.content">
					You lost at least one <ActionLink {...this.data.actions.THUNDER_III}/> proc by allowing <StatusLink {...this.data.statuses.THUNDERCLOUD}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-t3ps.why">
					<Plural value={droppedThunderClouds} one="# Thundercloud proc" other="# Thundercloud procs" /> expired.
				</Trans>,
			}))
		}

		const droppedFireStarters: number = this.getDropCountForStatus(this.data.statuses.FIRESTARTER.id)
		if (droppedFireStarters > 0) {
			this.suggestions.add(new Suggestion({
				icon: iconF3p,
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
