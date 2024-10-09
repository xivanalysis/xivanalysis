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
const DOUBLE_AWAKKEN_TIME = 30000 //Time it takes to double reawaken after Ire. it's coded to 1 GCD + 2 reawakens length of time.

const PREPEND_MESSAGE = <Trans id="vpr.serpentsIre.prepend-message"><DataLink action="SERPENTS_IRE"/> is the sign that a 2 minute window for party buffs is coming up. After using it, you should do 1 more GCD if needed to align with 2 minute buffs before using 2 full <DataLink action="REAWAKEN"/> windows back to back to maximize damage under buffs. </Trans>

export class SerpentsIre extends TimedWindow { // AKA Peusdo 2 Minute Window
	static override handle = 'serpentsIre'
	static override title = t('vpr.serpents_ire.title')`Serpent's Ire`
	static override displayOrder = DISPLAY_ORDER.SERPENTS_IRE

	override startAction = this.data.actions.SERPENTS_IRE
	override duration = DOUBLE_AWAKKEN_TIME // 30s. After Eye is cast, 1 GCD should be used before doing a double reawaken back to back

	protected override prependMessages?: React.ReactElement = PREPEND_MESSAGE

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
				Make sure that you are pooling your Serpent's Offerings gauge to maximize the number of <DataLink action="REAWAKEN"/>s and <DataLink action="OUROBOROS"/>s that you can do under raid buffs. </Trans>,
			suggestionWindowName: <DataLink action="SERPENTS_IRE"/>,
			severityTiers: SEVERITY_TIERS,
			adjustCount: this.adjustExpectedActionCount,

		}))
	}

}
