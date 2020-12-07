import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch540: Layer<ActionRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 cooldown/potency changes
		BOOTSHINE: {potency: 200},
		TRUE_STRIKE: {potency: 270},
		TWIN_SNAKES: {potency: 230},
		RIDDLE_OF_EARTH: {charges: 3},
		TORNADO_KICK: {cooldown: 45, potency: 400},
	},
}
