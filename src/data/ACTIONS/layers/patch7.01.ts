import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch701: Layer<ActionRoot> = {
	patch: '7.01',
	data: {
		TENDO_SETSUGEKKA: {gcdRecast: 2500},
		TENDO_GOKEN: {gcdRecast: 2500},

		//AST 7.01 changes
		LIGHTSPEED: {
			charges: 2,
			cooldown: 60000,
		},
		ASTRAL_DRAW: {cooldown: 55000},
		UMBRAL_DRAW: {cooldown: 55000},
	},
}
