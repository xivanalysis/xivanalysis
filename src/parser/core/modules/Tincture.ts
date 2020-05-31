import {t} from '@lingui/macro'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'

export class Tincture extends BuffWindowModule {
	static handle = 'tincture'
	static title = t('core.tincture.title')`Tinctures`

	buffAction = ACTIONS.INFUSION_STR
	buffStatus = STATUSES.MEDICATED
}
