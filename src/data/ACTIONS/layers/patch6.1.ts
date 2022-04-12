import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch610: Layer<ActionRoot> = {
	patch: '6.1',
	data: {
		//Tank Stance changes
		ROYAL_GUARD: {cooldown: 3000},
		GRIT: {cooldown: 3000},
		IRON_WILL: {cooldown: 3000},
		DEFIANCE: {cooldown: 3000},
	},
}
