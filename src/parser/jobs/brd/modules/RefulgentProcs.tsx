import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class RefulgentProcs extends Procs {
	trackedProcs = [
		{
			procStatus: this.data.statuses.STRAIGHT_SHOT_READY,
			consumeActions: [this.data.actions.REFULGENT_ARROW],
		},
	]

	protected addJobSpecificSuggestions() {
		const missedSSR = this.getDropCountForStatus(this.data.statuses.STRAIGHT_SHOT_READY.id)
		const overWrittenSSR = this.getOverwriteCountForStatus(this.data.statuses.STRAIGHT_SHOT_READY.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REFULGENT_ARROW.icon,
			content: <Trans id="brd.procs.suggestions.missed.content">
				Try to use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> whenever you have <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} />.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: missedSSR,
			why: <Trans id="brd.procs.suggestions.missed.why">
				You dropped {missedSSR} <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> <Plural value={missedSSR} one="proc" other="procs" />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REFULGENT_ARROW.icon,
			content: <Trans id="brd.procs.suggestions.overwritten.content">
				Avoid using actions that grant <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> when you
				could use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> instead.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: overWrittenSSR,
			why: <Trans id="brd.procs.suggestions.overwritten.why">
				You overwrote {overWrittenSSR} <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> <Plural value={overWrittenSSR} one="proc" other="procs" />.
			</Trans>,
		}))
	}
}
