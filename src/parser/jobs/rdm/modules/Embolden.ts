import {t} from '@lingui/macro'
import {BuffWindow} from 'parser/core/modules/ActionWindow'

export class Embolden extends BuffWindow {
	static override handle = 'embolden'
	static override title = t('rdm.embolden.title')`Embolden`

	buffStatus = this.data.statuses.EMBOLDEN_MAGIC

	// No initialise since only the table display is desired without
	// any evaluation as to expected actions.
}
