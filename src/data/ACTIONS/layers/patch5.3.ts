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

		// AST 5.3 changes
		HELIOS: {mpCost: 700},
		BENEFIC_II: {mpCost: 700},
		ASPECTED_BENEFIC: {mpCost: 400},
		ASPECTED_BENEFIC_NOCTURNAL: {mpCost: 700},
		ASPECTED_HELIOS: {mpCost: 800},
		COMBUST_II: {mpCost: 400},
	},
}
