import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch701: Layer<StatusRoot> = {
	patch: '7.01',
	data: {
		// Patch 7.01 statuses

		// Warrior's Primal Ruination proc reduced from 30s to 20s
		PRIMAL_RUINATION_READY: {
			duration: 20000,
		},

	},
}
