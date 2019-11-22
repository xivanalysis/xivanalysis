import {PatchNumber} from 'data/PATCHES'

interface Something {
	id: number
}

const ensureSomething = <T extends Record<string, Something>>(x: T): Record<keyof T, Something> => x

const root = ensureSomething({
	foo: {id: 1},
})

type LayerPartial<R> = {[K in keyof R]?: Partial<R[K]>}

class Layer<R> {
	patch: PatchNumber
	data: LayerPartial<R>

	constructor(opts: {
		patch: PatchNumber,
		data: LayerPartial<R>,
	}) {
		this.patch = opts.patch
		this.data = opts.data
	}
}

export const layers: Array<Layer<typeof root>> = [
	new Layer({patch: '5.0', data: root}),
	new Layer({patch: '5.01', data: {
		foo: {id: 10},
	}}),
]
