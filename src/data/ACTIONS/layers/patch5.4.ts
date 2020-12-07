import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch540: Layer<ActionRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 cooldown/potency changes
		BOOTSHINE: {potency: 200},
		TRUE_STRIKE: {potency: 270},
		SNAP_PUNCH: {potency: 270},
		TWIN_SNAKES: {potency: 230},
		ARM_OF_THE_DESTROYER: {potency: 110},
		DEMOLISH: {potency: 80},
		ROCKBREAKER: {potency: 150},
		FOUR_POINT_FURY: {potency: 140},
		DRAGON_KICK: {potency: 230},
		MEDITATION: {cooldown: 1},
		THE_FORBIDDEN_CHAKRA: {potency: 340},
		ELIXIR_FIELD: {potency: 250},
		RIDDLE_OF_EARTH: {charges: 3},
		TORNADO_KICK: {cooldown: 45, potency: 400},
		SIX_SIDED_STAR: {potency: 540},
	},
}
