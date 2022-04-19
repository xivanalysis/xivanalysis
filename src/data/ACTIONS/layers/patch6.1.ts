import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch610: Layer<ActionRoot> = {
	patch: '6.1',
	data: {
		// Tank 6.1 cooldown changes
		DEFIANCE: {cooldown: 3000},
		GRIT: {cooldown: 3000},
		IRON_WILL: {cooldown: 3000},
		ROYAL_GUARD: {cooldown: 3000},

		//SAM 6.1 action changes:
		HISSATSU_KAITEN: {id: SHARED.UNKNOWN.id}, //Kaiten was removed. But is job critical for pre-6.1 analysis.
	},
}
