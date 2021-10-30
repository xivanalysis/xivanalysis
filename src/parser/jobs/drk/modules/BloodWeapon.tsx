import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow/evaluators/ExpectedGcdCountEvaluator'
import {BuffWindow} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class BloodWeapon extends BuffWindow {
	static override handle = 'bloodweapon'
	static override title = t('drk.bloodweapon.title')`Blood Weapon Usage`
	static override displayOrder = DISPLAY_ORDER.BLOOD_WEAPON

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.BLOOD_WEAPON

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 5,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.BLOOD_WEAPON.icon,
			suggestionContent: <Trans id="drk.bloodweapon.suggestions.missedgcd.content">
				Try to land 5 GCDs during every <ActionLink action="BLOOD_WEAPON" /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
			</Trans>,
			windowName: this.data.actions.BLOOD_WEAPON.name,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
		}))
	}

}
