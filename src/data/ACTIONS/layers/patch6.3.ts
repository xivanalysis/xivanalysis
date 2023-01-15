import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch630: Layer<ActionRoot> = {
	patch: '6.3',
	data: {
		// BRD - Nature's Minne CD change
		NATURES_MINNE: {cooldown: 120000},
		// DRG - Life Surge CD change
		LIFE_SURGE: {cooldown: 40000},
		// WHM - Assize CD change
		ASSIZE: {cooldown: 40000},

		/// SGE - Phlegma's cooldown (all tiers) was reduced to 40s
		PHLEGMA: {cooldown: 40000},
		PHLEGMA_II: {cooldown: 40000},
		PHLEGMA_III: {cooldown: 40000},
	},
}
