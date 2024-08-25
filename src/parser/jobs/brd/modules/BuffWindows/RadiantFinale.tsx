import {t} from '@lingui/macro'
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
}
