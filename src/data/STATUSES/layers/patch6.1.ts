import { Layer } from 'data/layer'
import { StatusRoot } from '../root'

export const patch610: Layer<StatusRoot> = {
	patch: '6.1',
	data: {
		// SCH 6.1 duration changes
		EXPEDIENCE: { duration: 10000 },
	},
}
