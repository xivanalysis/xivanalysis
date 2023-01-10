import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch630: Layer<ActionRoot> = {
	patch: '6.3',
	data: {
		//WHM - Assize CD change
		ASSIZE: {cooldown: 40000},
	},
}
