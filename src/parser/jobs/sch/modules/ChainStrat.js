import React from 'react'
import {Trans} from '@lingui/react'

import CooldownDowntime from 'parser/core/modules/CooldownDowntime'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'

const CHAIN_STRAT_START_OFFSET = 10000
const CHAIN_STRAT_OFFSET = 7500

export default class ChainStrat extends CooldownDowntime {
	trackedCds = [ACTIONS.CHAIN_STRATAGEM.id]
	allowedDowntime = CHAIN_STRAT_OFFSET
	firstUseOffset = CHAIN_STRAT_START_OFFSET
	description = <Trans id="sch.chainstrat.cooldown.description">
		Try to use <ActionLink {...ACTIONS.CHAIN_STRATAGEM}/> on cooldown throughout the fight, particularly when your team has other buffs up for maximum effect.
	</Trans>
}
