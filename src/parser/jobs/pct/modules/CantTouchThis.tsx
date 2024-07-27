import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class CantTouchThis extends BuffWindow {
	static override handle = 'hammertime'
	static override title = t('pct.hammertime.title')`Hammer Time Usage`
	static override displayOrder = DISPLAY_ORDER.HAMMER_TIME

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.HAMMER_TIME
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		this.trackOnlyActions([
			this.data.actions.HAMMER_BRUSH.id,
			this.data.actions.HAMMER_STAMP.id,
			this.data.actions.POLISHING_HAMMER.id,
		])

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: this.data.statuses.HAMMER_TIME.stacksApplied,
			globalCooldown: this.globalCooldown,
			hasStacks: true,
			suggestionIcon: this.data.actions.STRIKING_MUSE.icon,
			suggestionContent: <Trans id="pct.hammertime.suggestions.missedgcd.content">
				The hammer combo is a useful mix of damage, movement utility, and cooldown weaving space. Make sure to use all three hits each time you use <DataLink action="STRIKING_MUSE" />.
			</Trans>,
			suggestionWindowName: <DataLink showIcon={false} status="HAMMER_TIME" />,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
		}))
	}
}
