import {PatchNumber} from 'data/PATCHES'
import {root, StatusRoot} from './root'

// This should be moved to data root?
interface Layer<R> {
	patch: PatchNumber
	data: {[K in keyof R]?: Partial<R[K]>}
}

function applyLayer<R>(base: R, layer: Layer<R>): R {
	const applied = {...base}
	const keys = Object.keys(layer.data) as Array<keyof R>
	keys.forEach(key => {
		applied[key] = {...applied[key], ...layer.data[key]}
	})
	return applied
}

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
