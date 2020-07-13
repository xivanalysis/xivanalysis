import React, {Fragment} from 'react'
import {MessageDescriptor} from '@lingui/core'
import {t, Trans} from '@lingui/macro'
import Module, {dependency} from 'parser/core/Module'
import DragonSight from './DragonSight'
import LanceCharge from './LanceCharge'
import BattleLitany from './BattleLitany'
import {Header, Accordion} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class DrgBuffWindows extends Module {
	static handle: string = 'drgbuffs'
	static title: MessageDescriptor = t('drg.buffwindows.title')`Dragoon Buffs`
	static displayOrder = DISPLAY_ORDER.BUFFS

	@dependency private lanceCharge!: LanceCharge
	@dependency private dragonSight!: DragonSight
	@dependency private battleLitany!: BattleLitany

	output() {
		const buffPanels = [
			{
				title: {
					key: 'title-lc',
					content: <Trans id="drg.buffs.lance-charge.header">Lance Charge</Trans>,
				},
				content: {
					key: 'content-lc',
					content: this.lanceCharge.renderTable(),
				},
			},
			{
				title: {
					key: 'title-ds',
					content: <Trans id="drg.buffs.dragon-sight.header">Dragon Sight</Trans>,
				},
				content: {
					key: 'content-ds',
					content: this.dragonSight.renderTable(),
				},
			},
			{
				title: {
					key: 'title-bl',
					content: <Trans id="drg.buffs.battle-lit.header">Battle Litany</Trans>,
				},
				content: {
					key: 'content-bl',
					content: this.battleLitany.renderTable(),
				},
			},
		]


		return <Fragment>
			<Accordion exclusive={false} panels={buffPanels} styled fluid />
		</Fragment>
	}
}
