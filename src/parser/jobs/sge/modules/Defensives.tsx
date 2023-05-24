import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import React from 'react'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.PNEUMA,
		this.data.actions.HOLOS,
		this.data.actions.PANHAIMA,
		this.data.actions.HAIMA,
		this.data.actions.PHYSIS_II,
		this.data.actions.SOTERIA,
		this.data.actions.RHIZOMATA,
		this.data.actions.KRASIS,
	]

	// Retaining old Trans ID to maintain i18n
	protected override headerContent = <Trans id="sge.cooldownDowntime.defense-cd-metric">
		Using your mitigation and healing cooldowns allows you to help keep the party healthy while continuing to deal damage to enemies and healing to your <DataLink showIcon={false} action="KARDIA" /> target.
		While you shouldn't waste these actions, you should try to plan out when to use them to maximize their utility.
	</Trans>
}
