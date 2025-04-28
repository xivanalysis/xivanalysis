import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch720: Layer<StatusRoot> = {
	patch: '7.2',
	data: {
		// BLM Status changes
		// Procs are now permanent until used
		THUNDERHEAD: {
			duration: undefined,
		},
		FIRESTARTER: {
			duration: undefined,
		},
		// Ley Lines duration is nerfed to 20s
		LEY_LINES: {
			duration: 20000,
		},
	},
}
