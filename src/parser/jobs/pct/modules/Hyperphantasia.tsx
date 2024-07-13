import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Hyperphantasia extends BuffWindow {
	static override handle = 'hyperphantasia'
	static override title = t('pct.hyperphantasia.title')`Hyperphantasia Usage`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.HYPERPHANTASIA
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		this.trackOnlyActions([
			this.data.actions.FIRE_IN_RED.id,
			this.data.actions.FIRE_II_IN_RED.id,
			this.data.actions.BLIZZARD_IN_CYAN.id,
			this.data.actions.BLIZZARD_II_IN_CYAN.id,
			this.data.actions.AERO_IN_GREEN.id,
			this.data.actions.AERO_II_IN_GREEN.id,
			this.data.actions.STONE_IN_YELLOW.id,
			this.data.actions.STONE_II_IN_YELLOW.id,
			this.data.actions.WATER_IN_BLUE.id,
			this.data.actions.WATER_II_IN_BLUE.id,
			this.data.actions.THUNDER_IN_MAGENTA.id,
			this.data.actions.THUNDER_II_IN_MAGENTA.id,
			this.data.actions.HOLY_IN_WHITE.id,
			this.data.actions.COMET_IN_BLACK.id,
			this.data.actions.STAR_PRISM.id,
		])

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: this.data.statuses.HYPERPHANTASIA.stacksApplied,
			globalCooldown: this.globalCooldown,
			hasStacks: true,
			suggestionIcon: this.data.statuses.HYPERPHANTASIA.icon,
			suggestionContent: <Trans id="pct.hyperphantasia.suggestions.missedgcd.content">
				<DataLink status="HYPERPHANTASIA" /> allows for faster casting of your aetherhue spells while combined with <DataLink status="INSPIRATION" />, and using all of the stacks is required to generate a <DataLink status="RAINBOW_BRIGHT" /> for a quick use of <DataLink action="RAINBOW_DRIP" />.<br/>
				Make sure you use them before they wear off.
			</Trans>,
			suggestionWindowName: <DataLink showIcon={false} status="HYPERPHANTASIA" />,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
		}))
	}
}
