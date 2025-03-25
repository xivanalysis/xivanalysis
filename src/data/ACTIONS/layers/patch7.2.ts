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
	},
}
