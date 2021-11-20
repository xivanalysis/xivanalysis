import {t} from '@lingui/macro'
import {BuffWindow} from './ActionWindow/windows/BuffWindow'

export class Tincture extends BuffWindow {
	static override handle = 'tincture'
	static override title = t('core.tincture.title')`Tinctures`

	buffStatus = this.data.statuses.MEDICATED

	// No initialise since only the table display is desired without
	// any evaluation as to expected actions.
}
