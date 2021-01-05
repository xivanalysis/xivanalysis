import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch540: Layer<ActionRoot> = {
	patch: '5.4',
	data: {
		// BRD 5.4 potency changes
		BURST_SHOT: {potency: 250},

		// DRG 5.4 potency changes
		FANG_AND_CLAW: {potency: 370},
		WHEELING_THRUST: {potency: 370},

		// MNK 5.4 cooldown/potency changes - using correct positional potency and assuming no leaden
		BOOTSHINE: {potency: 200},
		TRUE_STRIKE: {potency: 300},
		TWIN_SNAKES: {potency: 260},
		RIDDLE_OF_EARTH: {charges: 3, cooldown: 30, statusesApplied: ['RIDDLE_OF_EARTH']},
		TORNADO_KICK: {cooldown: 45},

		// NIN 5.4 potency changes
		SPINNING_EDGE: {potency: 230},
		GUST_SLASH: {combo: {
			from: 2240,
			potency: 340,
		}},
	},
}
