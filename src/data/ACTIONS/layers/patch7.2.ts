import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {BonusModifier} from '../type'

export const patch720: Layer<ActionRoot> = {
	patch: '7.2',
	data: {
		// DRG
		DRAKESBANE: {
			potencies: [{
				value: 460,
				bonusModifiers: [],
			}],
		},
		STARDIVER: {
			potencies: [{
				value: 840,
				bonusModifiers: [],
			}],
		},
		HEAVENS_THRUST: {
			potencies: [{
				value: 160,
				bonusModifiers: [],
			}, {
				value: 460,
				bonusModifiers: [BonusModifier.COMBO],
			}],
		},
		// MNK
		WINDS_REPLY: {
			potencies: [{
				value: 1040,
				bonusModifiers: [],
			}],
		},
		FIRES_REPLY: {
			potencies: [{
				value: 1400,
				bonusModifiers: [],
			}],
		},
		//RDM
		VICE_OF_THORNS: {
			potency: 800,
		},
		PREFULGENCE: {
			potency: 1000,
		},
	},
}
