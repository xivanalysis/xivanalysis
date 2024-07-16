import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {RaidBuffWindow, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class SearingLight extends RaidBuffWindow {
	static override handle = 'searinglight'
	static override title = t('smn.searinglight.title')`Searing Light`
	static override displayOrder = DISPLAY_ORDER.SEARING_LIGHT

	override buffStatus: Status | Status[] = this.data.statuses.SEARING_LIGHT

	override initialise(): void {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.SEARING_FLASH,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.SEARING_FLASH.icon,
			suggestionContent: <Trans id="smn.searinglight.suggestions.content">
				Use <ActionLink action="SEARING_FLASH"/> during each <ActionLink action="SEARING_LIGHT"/> buff.
			</Trans>,
			suggestionWindowName: <ActionLink action="SEARING_LIGHT" showIcon={false} />,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
		}))
	}

}
