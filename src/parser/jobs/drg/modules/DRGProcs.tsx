import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Procs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class DRGProcs extends Procs {
	trackedProcs = [
		{
			procStatus: STATUSES.SHARPER_FANG_AND_CLAW,
			consumeActions: [ACTIONS.FANG_AND_CLAW],
		},
		{
			procStatus: STATUSES.ENHANCED_WHEELING_THRUST,
			consumeActions: [ACTIONS.WHEELING_THRUST],
		},
		{
			procStatus: STATUSES.DIVE_READY,
			consumeActions: [ACTIONS.MIRAGE_DIVE],
		},
	]

	protected addJobSpecificSuggestions(): void {
		const droppedFang = this.getDropsForStatus(STATUSES.SHARPER_FANG_AND_CLAW.id).length - this.getUsagesForStatus(STATUSES.SHARPER_FANG_AND_CLAW.id).length
		const droppedWheeling = this.getDropsForStatus(STATUSES.ENHANCED_WHEELING_THRUST.id).length - this.getUsagesForStatus(STATUSES.ENHANCED_WHEELING_THRUST.id).length
		const droppedMirage = this.getDropsForStatus(STATUSES.DIVE_READY.id).length - this.getUsagesForStatus(STATUSES.DIVE_READY.id).length
		const overwrittenDiveReady = this.getOverwritesForStatus(STATUSES.DIVE_READY.id).length

		this.suggestions.add(new TieredSuggestion({
			icon: droppedFang >= droppedWheeling ? ACTIONS.FANG_AND_CLAW.icon : ACTIONS.WHEELING_THRUST.icon,
			content: <Trans id="drg.procs.suggestions.extenders.content">
				Avoid interrupting your combos at the <ActionLink {...ACTIONS.FANG_AND_CLAW}/> and <ActionLink {...ACTIONS.WHEELING_THRUST}/> stages, as it causes you to lose the procs that allow you to cast them, costing you both the cast and the <ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> duration that comes with it.
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
			icon: ACTIONS.MIRAGE_DIVE.icon,
			content: <Trans id="drg.procs.suggestions.mirage-dropped.content">
				Avoid letting your <StatusLink {...STATUSES.DIVE_READY}/> procs fall off, as it can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
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

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MIRAGE_DIVE.icon,
			content: <Trans id="drg.procs.suggestions.mirage-overwritten.content">
				Avoid casting <ActionLink {...ACTIONS.JUMP}/> and <ActionLink {...ACTIONS.SPINESHATTER_DIVE}/> when you already have a <StatusLink {...STATUSES.DIVE_READY}/> procs, as it overwrites them and can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: overwrittenDiveReady,
			why: <Trans id="drg.procs.suggestions.mirage-overwritten.why">
				You overwrote <Plural value={overwrittenDiveReady} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
			</Trans>,
		}))
	}
}
