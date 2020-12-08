import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch540: Layer<ActionRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 cooldown/potency changes - using correct positional potency and assuming no leaden
		BOOTSHINE: {potency: 200},
		TRUE_STRIKE: {potency: 300},
		TWIN_SNAKES: {potency: 260},
		RIDDLE_OF_EARTH: {charges: 3, cooldown: 30, statusesApplied: ['RIDDLE_OF_EARTH']},
		TORNADO_KICK: {cooldown: 45},
	},
}
