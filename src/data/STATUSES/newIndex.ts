import {PatchNumber} from 'data/PATCHES'
import {root} from './root'

export type NoInfer<T> = T & { [K in keyof T]: T[K] }

// This should be moved to data root?
interface Layer<R> {
	patch: PatchNumber
	data: {[K in keyof R]?: Partial<R[K]>}
}

function applyLayer<R>(base: R, layer: Layer<R>): R {
	const keys = Object.keys(layer.data) as Array<keyof R>
	return keys.reduce(
		(acc, cur) => ({
			...acc,
			[cur]: {...acc[cur], ...layer.data[cur]},
		}),
		{...base},
	)
}

// guessing this will be what data module operates on
export {root}
export const layers: Array<Layer<typeof root>> = [
	// {patch: '5.0', data: root},
	{patch: '5.01', data: {
		BIO_II: {id: 1000},
	}},
]

// need to export a collated everything-applied as default for back compat
const collated = layers.reduce((acc, cur) => applyLayer(acc, cur), root)

// in dev, maybe proxy the collated and print warnings so we can aim towards 0?

export default collated
