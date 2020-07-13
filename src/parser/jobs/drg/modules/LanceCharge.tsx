import {DrgBuffWindowModule} from './DrgBuffWindow'
import {t} from '@lingui/macro'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class LanceCharge extends DrgBuffWindowModule {
	static handle: string = 'lancecharge'
	static title = t('drg.lancecharge.title')`Lance Charge`

	buffAction = ACTIONS.LANCE_CHARGE
	buffStatus = [STATUSES.LANCE_CHARGE]
}
