import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {MuseBuffWindow} from './MuseBuffWindow'

export class RadiantFinale extends MuseBuffWindow {
	static override handle = 'radiantfinale'
	static override title = t('brd.radiantfinale.title')`Radiant Finale`
	static override displayOrder = DISPLAY_ORDER.RADIANT_FINALE

	action: Action = this.data.actions.RADIANT_FINALE
	buffStatus: Status = this.data.statuses.RADIANT_FINALE

	override prependMessages = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="brd.burst.header.radiantfinale.content">
				The rotation table below shows actions used while <StatusLink status="RADIANT_FINALE"/> were present.
				<br/>
				The expected number of GCDs under the effect of all of <StatusLink status="RADIANT_FINALE"/> is 8 GCDs (9 GCDs with <DataLink status="ARMYS_MUSE"/> when possible).
			</Trans>
		</Message.Content>
	</Message>
}
