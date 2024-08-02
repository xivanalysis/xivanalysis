import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'
import React from 'react'

export class Tomahawk extends CoreDisengageGcds {
	protected override trackedAction = this.data.actions.TOMAHAWK
	protected override disengageInfo = <Trans id="war.disengage.statistic.info">
		While it is important to keep your GCD rolling as much as possible, try to minimize <DataLink action="TOMAHAWK" /> since it does less damage than your combo and does not build Beast Gauge.
	</Trans>
}
