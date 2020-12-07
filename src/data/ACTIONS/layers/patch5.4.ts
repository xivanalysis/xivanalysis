import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

// tslint:disable:no-magic-numbers

export const patch540: Layer<ActionRoot> = {
	patch: '5.4',
	data: {
		// NIN 5.4 potency changes
		SPINNING_EDGE: {potency: 230},
		GUST_SLASH: {combo: {
			from: 2240,
			potency: 340,
		}},
		// DRG 5.4 potency changes
		FANG_AND_CLAW: {potency: 370},
		WHEELING_THRUST: {potency: 370},
	},
}
