import {Trans} from '@lingui/react'
import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'
import React from 'react'

export class LightningShot extends CoreDisengageGcds {
	override disengageTitle = <Trans id="gnb.disengage.statistic.title">Lightning Shots</Trans>
	override disengageIcon = this.data.actions.LIGHTNING_SHOT.icon
	override disengageAction = this.data.actions.LIGHTNING_SHOT
}
