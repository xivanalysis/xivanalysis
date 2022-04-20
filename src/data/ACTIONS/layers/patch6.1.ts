import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch610: Layer<ActionRoot> = {
	patch: '6.1',
	data: {
		// NIN 6.1 raid buff changes
		TRICK_ATTACK: {statusesApplied: []},
		MUG: {statusesApplied: ['MUG_VULNERABILITY_UP']},

		// Tank 6.1 cooldown changes
		DEFIANCE: {cooldown: 3000},
		GRIT: {cooldown: 3000},
		IRON_WILL: {cooldown: 3000},
		ROYAL_GUARD: {cooldown: 3000},
	},
}
