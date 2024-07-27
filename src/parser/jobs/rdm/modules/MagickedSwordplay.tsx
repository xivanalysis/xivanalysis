import {t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {ActionEnhancingStatuses} from 'parser/core/modules/ActionEnhancingStatuses'
import {DISPLAY_ORDER} from 'parser/jobs/rdm/modules/DISPLAY_ORDER'
import React from 'react'

// Test log: unused MagickedSwordplay stacks - https://www.fflogs.com/reports/y9bc6qpf4KgVnvTX

export class MagickedSwordplay extends ActionEnhancingStatuses {
	static override displayOrder = DISPLAY_ORDER.MAGICKED_SWORDPLAY
	static override handle = 'MagickedSwordplay'
	static override title = t('rdm.ms.title')`Magicked Swordplay Windows`

	override trackedProcs = [
		{
			procStatus: this.data.statuses.MAGICKED_SWORDPLAY,
			consumeActions: [
				this.data.actions.ENCHANTED_RIPOSTE,
				this.data.actions.ENCHANTED_ZWERCHHAU,
				this.data.actions.ENCHANTED_REDOUBLEMENT,
				this.data.actions.ENCHANTED_MOULINET,
				this.data.actions.ENCHANTED_MOULINET_DEUX,
				this.data.actions.ENCHANTED_MOULINET_TROIS,
			],
		},
	]

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.ENCHANTED_ZWERCHHAU.icon
	override droppedProcContent = <Trans id="rdm.magickedswordplay.suggestions.missed.content">
		Try to use all three stacks of <DataLink status="MAGICKED_SWORDPLAY" /> by using a full enchanted sword combo whenever you use <DataLink action="MANAFICATION" />
	</Trans>

	override showInvulnProcSuggestion = true
}
