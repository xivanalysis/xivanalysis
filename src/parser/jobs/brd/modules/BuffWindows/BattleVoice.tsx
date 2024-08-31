import {t} from '@lingui/macro'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {MuseBuffWindow} from './MuseBuffWindow'

export class BattleVoice extends MuseBuffWindow {
	static override handle = 'battlevoice'
	static override title = t('brd.battlevoice.title')`Battle Voice`
	static override displayOrder = DISPLAY_ORDER.BATTLE_VOICE

	action: Action = this.data.actions.BATTLE_VOICE
	buffStatus: Status = this.data.statuses.BATTLE_VOICE
}
