import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch530: Layer<StatusRoot> = {
	patch: '5.3',
	data: {
		// Brutal Shell updated duration
		BRUTAL_SHELL: {duration: 30},
	},
}
