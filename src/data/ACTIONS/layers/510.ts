import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch510: Layer<ActionRoot> = {
	patch: '5.1',
	data: {
		COLLECTIVE_UNCONSCIOUS: {
			statusesApplied: [
				'COLLECTIVE_UNCONSCIOUS_DIURNAL_MITIGATION',
				'COLLECTIVE_UNCONSCIOUS',
				'WHEEL_OF_FORTUNE_DIURNAL',
				'COLLECTIVE_UNCONSCIOUS_NOCTURNAL',
				'WHEEL_OF_FORTUNE_NOCTURNAL',
			],
		},
		ASPECTED_HELIOS: {
			mpCost: 1000,
		},
		ASPECTED_HELIOS_NOCTURNAL: {
			mpCost: 1000,
		},
		ASPECTED_BENEFIC_NOCTURNAL: {
			mpCost: 900,
		},
	},
}
