import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class BloodWeapon extends BuffWindow {
	static override handle = 'bloodweapon'
	static override title = msg({id: 'drk.bloodweapon.title', message: 'Blood Weapon Usage'})
	static override displayOrder = DISPLAY_ORDER.BLOOD_WEAPON

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.BLOOD_WEAPON
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 5,
			globalCooldown: this.globalCooldown,
			hasStacks: true,
			suggestionIcon: this.data.actions.BLOOD_WEAPON.icon,
			suggestionContent: <Trans id="drk.bloodweapon.suggestions.missedgcd.content">
				Try to land 5 GCDs during every <ActionLink action="BLOOD_WEAPON" /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
			</Trans>,
			suggestionWindowName: <ActionLink action="BLOOD_WEAPON" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
		}))
	}

}
