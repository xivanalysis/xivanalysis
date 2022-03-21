import {Trans} from '@lingui/react'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import React from 'react'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.ARCANE_CREST,
		this.data.actions.FEINT,
	]

	protected override statisticOpts = {
		info: <Trans id="rpr.defensives.info">
			Arcane Crest can provide a significant amount of self-shielding and party healing over the course of the fight.
			Feint can mitigate raidwide damage that originates from a targettable enemy.
			These actions could potentially save you from wipes due to failed mechanics or under-mitigation and healing.
		</Trans>,
	}
}
