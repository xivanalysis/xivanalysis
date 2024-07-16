import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SEVERITIES = {
	MISSED_GCDS: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	WRONG_GCDS: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

export class Delirium extends BuffWindow {
	static override handle = 'delirium'
	static override title = t('drk.delirium.title')`Delirium Usage`
	static override displayOrder = DISPLAY_ORDER.DELIRIUM

	override buffStatus = this.data.statuses.DELIRIUM
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	@dependency globalCooldown!: GlobalCooldown

	override initialise() {
		super.initialise()

		const suggestionWindowName = <DataLink action="DELIRIUM" showIcon={false} />

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.SCARLET_DELIRIUM, expectedPerWindow: 1},
				{action: this.data.actions.COMEUPPANCE, expectedPerWindow: 1},
				{action: this.data.actions.TORCLEAVER, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.DELIRIUM.icon,
			suggestionContent: <Trans id="drk.delirium.suggestions.gcdactions.content">
				Each <DataLink action="DELIRIUM" /> window should contain <DataLink action="SCARLET_DELIRIUM" />, <DataLink action="COMEUPPANCE" />, and <DataLink action="TORCLEAVER" />.
				Using regular weaponskills resets your Delirium combo progress and causes you to lose the increased potency of the comboed skills.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.WRONG_GCDS,
		}))
	}
}
