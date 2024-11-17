import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch710: Layer<ActionRoot> = {
	patch: '7.1',
	data: {
		CRIMSON_CYCLONE: {
			statusesApplied: ['CRIMSON_STRIKE_READY'],
		},
	},
}
