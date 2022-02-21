import {Trans} from '@lingui/react'
import {Defensives} from 'parser/core/modules/Defensives'
import React from 'react'

export class RadiantAegis extends Defensives {
	protected override trackedDefensives = [this.data.actions.RADIANT_AEGIS]

	protected override statisticOpts = {
		info: <Trans id="smn.radiantaegis.info">The shield from Radiant Aegis can provide a significant amount of self-shielding over
			the course of the fight.  This shielding could potentially save you from deaths due to failed mechanics or under-mitigation and healing.
		</Trans>,
	}
}
