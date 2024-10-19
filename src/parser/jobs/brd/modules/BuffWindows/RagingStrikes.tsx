import {t} from '@lingui/macro'
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
}
