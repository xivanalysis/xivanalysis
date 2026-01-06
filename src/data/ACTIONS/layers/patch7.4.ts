import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch740: Layer<ActionRoot> = {
	patch: '7.4',
	data: {
		GNASHING_FANG: {
			speedAttribute: undefined,
			charges: 2,
		},
		BLOODFEST: {
			cooldown: 60000,
		},
		APEX_ARROW: {
			potency: 700,
		},
		BLAST_ARROW: {
			potency: 700,
		},
		RADIANT_ENCORE: {
			potency: [700, 800, 1100],
		},
	},
}
