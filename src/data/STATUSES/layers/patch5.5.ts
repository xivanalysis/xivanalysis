import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch550: Layer<StatusRoot> = {
	patch: '5.5',
	data: {
		// MNK 5.5 status updates
		RIDDLE_OF_EARTH: {duration: 10000, stacksApplied: 3},
	},
}
