import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch730: Layer<ActionRoot> = {
	patch: '7.3',
	data: {
		// RPR
		ENSHROUD: {
			cooldown: 5000,
		},
	},
}
