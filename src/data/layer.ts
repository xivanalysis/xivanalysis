import {PatchNumber} from './PATCHES'

export type LayerData<R> = {[K in keyof R]?: Partial<R[K]>}

export interface Layer<R> {
	patch: PatchNumber
	data: LayerData<R>
}

export function applyLayer<R>(base: R, layer: Layer<R>): R {
	const applied = {...base}
	const keys = Object.keys(layer.data) as Array<keyof R>
	keys.forEach(key => {
		applied[key] = {...applied[key], ...layer.data[key]}
	})
	return applied
}
