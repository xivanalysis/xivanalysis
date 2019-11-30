import {Layer} from 'data/layer'
import STATUSES from 'data/STATUSES'
import {StatusRoot} from '../root'

export const patch505: Layer<StatusRoot> = {
	patch: '5.05',
	data: {
		HOROSCOPE_HELIOS: {
			duration: 30,
		},
	},
}
