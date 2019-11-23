import {applyLayer, Layer} from 'data/layer'
import {root, StatusRoot} from './root'

// guessing this will be what data module operates on
export {root}
export const layers: Array<Layer<StatusRoot>> = [
	{patch: '5.01', data: {
		BIO_II: {id: 1000},
	}},
]

// need to export a collated everything-applied as default for back compat
const collated = layers.reduce((acc, cur) => applyLayer(acc, cur), root)

// in dev, maybe proxy the collated and print warnings so we can aim towards 0?

export default collated
