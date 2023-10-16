import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch650: Layer<ActionRoot> = {
	patch: '6.5',
	data: {
		// BRD - Potency changes
		EMPYREAL_ARROW: {potency: 240},
		SIDEWINDER: {potency: 320},
	},
}
