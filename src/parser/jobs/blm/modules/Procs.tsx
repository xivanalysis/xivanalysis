import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {ProcGroup, Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

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

	private hasSharpcast: boolean = false

	override initialise() {
		super.initialise()

		// Hacky workaround because Statuses aren't in Analyser format yet, can (and probably should) remove this when that's done
		const trackedStatusFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.SHARPCAST.id)
		this.addEventHook(trackedStatusFilter.type('statusApply'), () => { this.hasSharpcast = true })
		this.addEventHook(trackedStatusFilter.type('statusRemove'), () => { this.hasSharpcast = false })
	}

	protected override jobSpecificCheckConsumeProc(_procGroup: ProcGroup, event: Events['action']): boolean {
		// If we were already hardcasting this spell, it does not consume the proc
		return !(this.castingSpellId != null && this.castingSpellId === event.action)
	}

	protected override jobSpecificOnConsumeProc(procGroup: ProcGroup, event: Events['action']): void {
		// BLM's procs are all instant-casts
		this.castTime.setInstantCastAdjustment([event.action], event.timestamp, event.timestamp)

		// Thunder procs used while sharpcast is up re-grant the proc status without technically removing it, so we need to forcibly add the 'removal' here to keep the 'dropped' counting correct
		if ((event.action === this.data.actions.THUNDER_III.id || event.action === this.data.actions.THUNDER_IV.id) && this.hasSharpcast) {
			this.tryAddEventToRemovals(procGroup, event)
		}
		return
	}

	protected override addJobSpecificSuggestions(): void {
		const droppedThunderClouds: number = this.getDropCountForStatus(this.data.statuses.THUNDERCLOUD.id)
		if (droppedThunderClouds > 0) {
			this.suggestions.add(new Suggestion({
				icon:  process.env.PUBLIC_URL + '/icon/action/t3p.png',
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
				icon: process.env.PUBLIC_URL + '/icon/action/f3p.png',
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
