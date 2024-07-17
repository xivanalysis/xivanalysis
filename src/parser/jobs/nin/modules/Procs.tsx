/**
 * Example logs:
 * https://www.fflogs.com/reports/gWpnqRyfFY1TZm7D#fight=1 (2 dropped Phantom Kamaitachis, 1 dropped Tenri Jindo)
 */

import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const DROP_SEVERITY = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

export class Procs extends CoreProcs {
	static override title = t('nin.procs.title')`Dropped Procs`
	override showProcTimelineRow = false

	override trackedProcs = [
		{
			procStatus: this.data.statuses.PHANTOM_KAMAITACHI_READY,
			consumeActions: [this.data.actions.PHANTOM_KAMAITACHI],
		},
		{
			procStatus: this.data.statuses.TENRI_JINDO_READY,
			consumeActions: [this.data.actions.TENRI_JINDO],
		},
	]

	protected override addJobSpecificSuggestions(): void {
		const droppedPhantomKamaitachis: number = this.getDropCountForStatus(this.data.statuses.PHANTOM_KAMAITACHI_READY.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PHANTOM_KAMAITACHI.icon,
			content: <Trans id="nin.procs.suggestions.dropped-pk-ready.content">
				Avoid letting <StatusLink status="PHANTOM_KAMAITACHI_READY"/> fall off without using <ActionLink action="PHANTOM_KAMAITACHI"/>, as it has considerable potency and generates 10 Ninki.
			</Trans>,
			tiers: DROP_SEVERITY,
			value: droppedPhantomKamaitachis,
			why: <Trans id="nin.procs.suggestions.dropped-pk-ready.why">
				You allowed Phantom Kamaitachi Ready to fall off <Plural value={droppedPhantomKamaitachis} one="# time" other="# times" />.
			</Trans>,
		}))

		const droppedTenriJindos: number = this.getDropCountForStatus(this.data.statuses.TENRI_JINDO_READY.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TENRI_JINDO.icon,
			content: <Trans id="nin.procs.suggestions.dropped-tj-ready.content">
				Avoid letting <StatusLink status="TENRI_JINDO_READY"/> fall off without using <ActionLink action="TENRI_JINDO"/>, as it has very high potency and should always fall under 2-minute buff windows.
			</Trans>,
			tiers: DROP_SEVERITY,
			value: droppedTenriJindos,
			why: <Trans id="nin.procs.suggestions.dropped-tj-ready.why">
				You allowed Tenri Jindo Ready to fall off <Plural value={droppedTenriJindos} one="# time" other="# times" />.
			</Trans>,
		}))
	}
}
