import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch501: Layer<ActionRoot> = {
	patch: '5.01',
	data: {
		// AST 5.01 mp changes
		GRAVITY: {
			mpCost: 600,
		},
	},
}
