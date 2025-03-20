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
		//RDM
		VICE_OF_THORNS: {
			potency: 800,
		},
		PREFULGENCE: {
			potency: 1000,
		},		// BLM Cast time changes
		FLARE_STAR: {
			castTime: 2000,
		},
		FIRE_IV: {
			castTime: 2000,
		},
		FIRE_I: {
			castTime: 2000,
		},
		BLIZZARD_IV: {
			castTime: 2000,
		},
		BLIZZARD_I: {
			castTime: 2000,
		},
		FLARE: {
			castTime: 2000,
		},
		FREEZE: {
			castTime: 2000,
		},
	},
}
