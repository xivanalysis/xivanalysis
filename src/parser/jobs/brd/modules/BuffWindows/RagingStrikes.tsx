import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {MuseBuffWindow} from './MuseBuffWindow'

export class RagingStrikes extends MuseBuffWindow {
	static override handle = 'ragingstrikes'
	static override title = t('brd.ragingstrikes.title')`Raging Strikes`
	static override displayOrder = DISPLAY_ORDER.RAGING_STRIKES

    action: Action = this.data.actions.RAGING_STRIKES
	buffStatus: Status = this.data.statuses.RAGING_STRIKES

	override prependMessages = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="brd.burst.header.ragingstrikes.content">
				The rotation table below shows actions used while <StatusLink status="RAGING_STRIKES"/> were present.
				<br/>
				The expected number of GCDs under the effect of all of <StatusLink status="RAGING_STRIKES"/> is 8 GCDs (9 GCDs with <DataLink status="ARMYS_MUSE"/> when possible).
			</Trans>
		</Message.Content>
	</Message>
}
