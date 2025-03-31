import {msg} from '@lingui/core/macro'
import {BuffWindow} from './ActionWindow/windows/BuffWindow'

export class Tincture extends BuffWindow {
	static override handle = 'tincture'
	static override title = msg({id: 'core.tincture.title', message: 'Tinctures'})

	buffStatus = this.data.statuses.MEDICATED

	// No initialise since only the table display is desired without
	// any evaluation as to expected actions.
}
