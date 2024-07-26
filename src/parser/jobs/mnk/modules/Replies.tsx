import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const FR_DROP_SEVERITY = {
	1: SEVERITY.MAJOR,
}

const WR_DROP_SEVERITY = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

export class Replies extends Procs {
	static override title = t('mnk.replies.title')`Replies`
	override showProcTimelineRow = false

	override trackedProcs = [
		{
			procStatus: this.data.statuses.FIRES_RUMINATION,
			consumeActions: [this.data.actions.FIRES_REPLY],
		},
		{
			procStatus: this.data.statuses.WINDS_RUMINATION,
			consumeActions: [this.data.actions.WINDS_REPLY],
		},
	]

	protected override addJobSpecificSuggestions(): void {
		const droppedFiresReplies: number = this.getDropCountForStatus(this.data.statuses.FIRES_RUMINATION.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FIRES_REPLY.icon,
			content: <Trans id="mnk.procs.suggestions.dropped-fr.content">
				Avoid letting <StatusLink status="FIRES_RUMINATION"/> fall off without using <ActionLink action="FIRES_REPLY"/>, as it is a massive contributor to your burst windows.
			</Trans>,
			tiers: FR_DROP_SEVERITY,
			value: droppedFiresReplies,
			why: <Trans id="mnk.replies.suggestions.dropped-fr.why">
				You allowed Fire's Rumination to fall off <Plural value={droppedFiresReplies} one="# time" other="# times" />.
			</Trans>,
		}))

		const droppedWindsReplies: number = this.getDropCountForStatus(this.data.statuses.WINDS_RUMINATION.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.WINDS_REPLY.icon,
			content: <Trans id="mnk.replies.suggestions.dropped-wr.content">
				Avoid letting <StatusLink status="WINDS_RUMINATION"/> fall off without using <ActionLink action="WINDS_REPLY"/>.
			</Trans>,
			tiers: WR_DROP_SEVERITY,
			value: droppedWindsReplies,
			why: <Trans id="mnk.replies.suggestions.dropped-wr.why">
				You allowed Wind's Rumination to fall off <Plural value={droppedWindsReplies} one="# time" other="# times" />.
			</Trans>,
		}))
	}
}
