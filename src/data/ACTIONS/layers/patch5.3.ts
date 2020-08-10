import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch530: Layer<ActionRoot> = {
	patch: '5.3',
	data: {
		// BRD 5.3 potency changes
		BURST_SHOT: {potency: 240},
		SIDEWINDER: {potency: [100, 200, 350]},
		REFULGENT_ARROW: {potency: 340},

		// MNK 5.3 cooldown changes
		PERFECT_BALANCE: {cooldown: 90},
	},
}
