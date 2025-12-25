import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch740: Layer<StatusRoot> = {
	patch: '7.4',
	data: {
		COLLECTIVE_UNCONSCIOUS_MITIGATION: {
			duration: 10000,
		},

		BLOODFEST: {
			id: 5051,
			name: 'Bloodfest',
			icon: iconUrl(213623),
			duration: 30000,
		},

		SONIC_BREAK: {
			duration: 15000,
    	},

		MANAFICATION: {
			stacksApplied: 3,
		},
	},
}
