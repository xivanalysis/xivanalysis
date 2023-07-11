import {MessageDescriptor} from '@lingui/core'
import {t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

/** Zoe only affects healing spells, so we're only going to track those */
const GCD_HEALS: ActionKey[] = [
	'PNEUMA',
	'DIAGNOSIS',
	'EUKRASIAN_DIAGNOSIS',
	'PROGNOSIS',
	'EUKRASIAN_PROGNOSIS',
]

export class Zoe extends BuffWindow {
	static override handle = 'Zoe'
	static override title: MessageDescriptor = t('sge.zoe.title')`Zoe Actions`
	static override displayOrder = DISPLAY_ORDER.ZOE

	@dependency private globalCooldown!: GlobalCooldown

	override buffStatus: Status = this.data.statuses.ZOE

	override initialise() {
		super.initialise()

		this.trackOnlyActions(GCD_HEALS.map(key => this.data.actions[key].id))

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 1,
			globalCooldown: this.globalCooldown,
			hasStacks: true,
			suggestionIcon: this.data.actions.ZOE.icon,
			suggestionContent: <Trans id="sge.zoe.missed.suggestion.content"><DataLink action="ZOE"/> increases the power of your next healing spell. Make sure to use one before it expires.</Trans>,
			suggestionWindowName: <DataLink action="ZOE" showIcon={false} />,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))
	}
}
