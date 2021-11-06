import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, BuffWindow, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Delirium extends BuffWindow {
	static override handle = 'delirium'
	static override title = t('drk.delirium.title')`Delirium Usage`
	static override displayOrder = DISPLAY_ORDER.DELIRIUM

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.DELIRIUM

	override initialise() {
		super.initialise()

		const suggestionWindowName = <ActionLink action="DELIRIUM" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 5,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.DELIRIUM.icon,
			suggestionContent: <Trans id="drk.delirium.suggestions.missedgcd.content">
				Try to land 5 GCDs during every <ActionLink action="DELIRIUM" /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new AllowedGcdsOnlyEvaluator({
			expectedGcdCount: 5,
			globalCooldown: this.globalCooldown,
			allowedGcds: [
				this.data.actions.BLOODSPILLER.id,
				this.data.actions.QUIETUS.id,
			],
			suggestionIcon: this.data.actions.BLOODSPILLER.icon,
			suggestionContent: <Trans id="drk.delirium.suggestions.badgcd.content">
				GCDs used during <ActionLink action="DELIRIUM"/> should be limited to <ActionLink action="BLOODSPILLER"/> for optimal damage (or <ActionLink action="QUIETUS"/> if three or more targets are present).
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))
	}
}
