import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'
import React from 'react'

export class Tomahawk extends CoreDisengageGcds {
	override disengageTitle = <Trans id="war.disengage.statistic.title">Tomahawk Uses</Trans>
	override disengageAction = this.data.actions.TOMAHAWK
	override disengageInfo = <Trans id="war.disengage.statistic.info">
		While it is important to keep your GCD rolling as much as possible, try to minimize <DataLink action="TOMAHAWK" /> since it does less damage than your combo actions and does not build Beast Gauge.
	</Trans>
	override disengageIcon = this.data.actions.TOMAHAWK.icon

}
