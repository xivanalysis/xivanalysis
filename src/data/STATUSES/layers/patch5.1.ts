import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch510: Layer<StatusRoot> = {
	patch: '5.1',
	data: {
		// WAR 5.1 duration changes
		RAW_INTUITION: {duration: 6000},
		VENGEANCE: {duration: 15000},
		HOLMGANG: {duration: 8000},
	},
}
