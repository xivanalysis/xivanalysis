import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {Icon, Message} from 'semantic-ui-react'
import {MuseBuffWindow} from './MuseBuffWindow'

export class BattleVoice extends MuseBuffWindow {
	static override handle = 'battlevoice'
	static override title = t('brd.battlevoice.title')`Battle Voice`
	static override displayOrder = DISPLAY_ORDER.BATTLE_VOICE

	action: Action = this.data.actions.BATTLE_VOICE
	buffStatus: Status = this.data.statuses.BATTLE_VOICE

	override prependMessages = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="brd.burst.header.battlevoice.content">
				The rotation table below shows actions used while <StatusLink status="BATTLE_VOICE"/> were present.
				<br/>
				The expected number of GCDs under the effect of all of <StatusLink status="BATTLE_VOICE"/> is 8 GCDs (9 GCDs with <DataLink status="ARMYS_MUSE"/> when possible).
			</Trans>
		</Message.Content>
	</Message>
}
