import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch620: Layer<ActionRoot> = {
	patch: '6.2',
	data: {
		// SGE - New shield status for Holos
		HOLOS: {statusesApplied: ['HOLOS', 'HOLOSAKOS']},
	},
}
