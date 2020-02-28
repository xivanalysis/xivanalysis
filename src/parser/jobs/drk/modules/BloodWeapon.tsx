import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class BloodWeapon extends BuffWindowModule {
	static handle = 'bloodweapon'
	static title = t('drk.bloodweapon.title')`Blood Weapon Usage`
	static displayOrder = DISPLAY_ORDER.BLOOD_WEAPON

	buffAction = ACTIONS.BLOOD_WEAPON
	buffStatus = STATUSES.BLOOD_WEAPON

	expectedGCDs = {
		expectedPerWindow: 5,
		suggestionContent: <Trans id="drk.bloodweapon.suggestions.missedgcd.content">
			Try to land 5 GCDs during every <ActionLink {...ACTIONS.BLOOD_WEAPON} /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}
}
