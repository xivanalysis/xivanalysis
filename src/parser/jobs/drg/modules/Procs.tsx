import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class Procs extends CoreProcs {
	trackedProcs = [
		{
			procStatus: this.data.statuses.SHARPER_FANG_AND_CLAW,
			consumeActions: [this.data.actions.FANG_AND_CLAW],
		},
		{
			procStatus: this.data.statuses.ENHANCED_WHEELING_THRUST,
			consumeActions: [this.data.actions.WHEELING_THRUST],
		},
		{
			procStatus: this.data.statuses.DIVE_READY,
			consumeActions: [this.data.actions.MIRAGE_DIVE],
		},
	]

	protected override addJobSpecificSuggestions(): void {
		const droppedFang = this.getDropCountForStatus(this.data.statuses.SHARPER_FANG_AND_CLAW.id)
		const droppedWheeling = this.getDropCountForStatus(this.data.statuses.ENHANCED_WHEELING_THRUST.id)
		const droppedMirage = this.getDropCountForStatus(this.data.statuses.DIVE_READY.id)

		this.suggestions.add(new TieredSuggestion({
			icon: droppedFang >= droppedWheeling ? this.data.actions.FANG_AND_CLAW.icon : this.data.actions.WHEELING_THRUST.icon,
			content: <Trans id="drg.procs.suggestions.extenders.content">
				Avoid interrupting your combos at the <ActionLink {...this.data.actions.FANG_AND_CLAW}/> and <ActionLink {...this.data.actions.WHEELING_THRUST}/> stages, as it causes you to lose the procs that allow you to cast them.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: droppedFang + droppedWheeling,
			why: <Trans id="drg.procs.suggestions.extenders.why">
				You dropped <Plural value={droppedFang} one="# Fang and Claw proc" other="# Fang and Claw procs"/> and <Plural value={droppedWheeling} one="# Wheeling Thrust proc" other="# Wheeling Thrust procs"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.MIRAGE_DIVE.icon,
			content: <Trans id="drg.procs.suggestions.mirage-dropped.content">
				Avoid letting your <StatusLink {...this.data.statuses.DIVE_READY}/> procs fall off, as it can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: droppedMirage,
			why: <Trans id="drg.procs.suggestions.mirage-dropped.why">
				You dropped <Plural value={droppedMirage} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
			</Trans>,
		}))
	}
}
