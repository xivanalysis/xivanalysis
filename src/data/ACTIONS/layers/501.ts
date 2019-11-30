import {Layer} from 'data/layer'
import STATUSES from 'data/STATUSES'
import {ActionRoot} from '../root'

export const patch501: Layer<ActionRoot> = {
	patch: '5.01',
	data: {
		GRAVITY: {
			mpCost: 600,
		},
	},
}
