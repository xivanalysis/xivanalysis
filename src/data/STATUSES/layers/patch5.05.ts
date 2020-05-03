import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch505: Layer<StatusRoot> = {
	patch: '5.05',
	data: {
		// AST 5.05 duration change
		HOROSCOPE_HELIOS: {duration: 30},
	},
}
