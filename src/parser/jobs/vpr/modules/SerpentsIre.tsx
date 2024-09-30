import {t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, ExpectedActionsEvaluator, TimedWindow} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const SEVERITY_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const OPENER_BUFFER = 30000 //After 30 seconds, you have reached the point that you could do 2 reawakens if you burst right there.

export class SerpentsIre extends TimedWindow { // AKA Peusdo 2 Minute Window
	static override handle = 'serpentsIre'
	static override title = t('vpr.serpents_ire.title')`"2 Minute Windows"`
	static override displayOrder = DISPLAY_ORDER.SERPENTS_IRE

	override startAction = this.data.actions.SERPENTS_IRE
	override duration = 30000 // 30s. After Eye is cast, 1 GCD should be used before doing a double reawaken back to back

	private adjustExpectedActionCount = (window: HistoryEntry<EvaluatedAction[]>) => {
		if (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) {
			return -1
		}
		return 0
	}

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.REAWAKEN,
					expectedPerWindow: 2,
				},
				{
					action: this.data.actions.OUROBOROS,
					expectedPerWindow: 2,
				},
			],
			suggestionIcon: this.data.actions.SERPENTS_IRE.icon,
			suggestionContent: <Trans id="vpr.serpents_ire.suggestions.trackedActions.content">
				<DataLink action="SERPENTS_IRE"/> is the sign that a 2 minute window for party buffs is coming up. After using it, you should do 1 more GCD to align with 2 minute buffs before using a full <DataLink action="REAWAKEN"/> window twice in a row.
			</Trans>,
			suggestionWindowName: <DataLink action="SERPENTS_IRE"/>,
			severityTiers: SEVERITY_TIERS,
			adjustCount: this.adjustExpectedActionCount,

		}))
	}

}
