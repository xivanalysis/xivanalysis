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
	},
}
