import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch530: Layer<StatusRoot> = {
	patch: '5.3',
	data: {
		// GNB 5.3 duration change
		BRUTAL_SHELL: {duration: 30},

		// WAR 5.3 (max) duration changes, most logic is in the module
		STORMS_EYE: {duration: 60},
	},
}
