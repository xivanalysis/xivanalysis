import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch701: Layer<StatusRoot> = {
	patch: '7.01',
	data: {
		// Patch 7.01 statuses

		// Warrior's Primal Ruination proc reduced from 30s to 20s
		PRIMAL_RUINATION_READY: {
			id: 3834,
			name: 'Primal Ruination Ready',
			icon: iconUrl(12569),
			duration: 20000,
		},

	},
}
