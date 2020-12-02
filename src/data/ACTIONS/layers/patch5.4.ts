import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch540: Layer<ActionRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 cooldown changes
		TORNADO_KICK: {cooldown: 45},
	},
}
