import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch740: Layer<StatusRoot> = {
	patch: '7.4',
	data: {
		COLLECTIVE_UNCONSCIOUS_MITIGATION: {
			duration: 10000,
		},
		MANAFICATION: {
			stacksApplied: 3,
		},
	},
}
