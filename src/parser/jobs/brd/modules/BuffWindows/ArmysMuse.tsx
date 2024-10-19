import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {dependency} from '../../../../core/Injectable'
import {BuffWindow} from '../../../../core/modules/ActionWindow'
import {RequiredGcdCountEvaluator} from '../../../../core/modules/ActionWindow/evaluators/RequiredGcdCountEvaluator'
import {GlobalCooldown} from '../../../../core/modules/GlobalCooldown'
import {SEVERITY} from '../../../../core/modules/Suggestions'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

export class ArmysMuse extends BuffWindow {
	static override handle = 'armysmuse'
	static override title = t('brd.armysmuse.title')`Army's Muse`
	static override displayOrder = DISPLAY_ORDER.ARMYS_MUSE

	@dependency globalCooldown!: GlobalCooldown

	buffStatus = this.data.statuses.ARMYS_MUSE

	override prependMessages = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="brd.burst.header.armysmuse.content">
				The rotation table below shows actions used while <StatusLink status="ARMYS_MUSE"/> were present.
				<br/>
				The expected number of GCDs under the effect of <StatusLink status="ARMYS_MUSE"/> is 5 GCDs.
			</Trans>
		</Message.Content>
	</Message>

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.ARMYS_PAEON.icon
		const suggestionContent = <Trans id="brd.armysmuse.suggestions.missedgcd.content">
			Try to land 5 GCDs during every <StatusLink status="ARMYS_MUSE"  /> window.
		</Trans>
		const suggestionWindowName = <ActionLink action="ARMYS_PAEON" showIcon={false}/>

		const evaluator = new RequiredGcdCountEvaluator({
			requiredGcds: 5,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent,
			suggestionWindowName,
			severityTiers: {
				0: SEVERITY.IGNORE,
			},
		})

		this.addEvaluator(evaluator)
	}
}
