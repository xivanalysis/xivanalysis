import {layers as actionLayers, root as actionRoot} from 'data/ACTIONS'
import {layers as statusLayers, root as statusRoot} from 'data/STATUSES'
import {Report} from 'report'
import {Patch, PatchNumber} from './PATCHES'

export type LayerData<R> = {[K in keyof R]?: Partial<R[K]>}

/** Representation of a conditional amendment to a root data object. */
export interface Layer<R> {
	patch: PatchNumber
	data: LayerData<R>
}

/**
 * Unconditionally apply the layer `layer` over the root object `base`,
 * returning a new object with the merged state
 */
export function applyLayer<R>(base: R, layer: Layer<R>): R {
	const applied = {...base}
	const keys = Object.keys(layer.data) as Array<keyof R>
	keys.forEach(key => {
		applied[key] = {...applied[key], ...layer.data[key]}
	})
	return applied
}

// Types and data for the cache of ready-applied roots. We only keep a single
// applied version cached per root, to reduce opportunities for leaks.
type CacheKey<R> = Omit<Layer<R>, 'data'>

interface CacheEntry<R> {
	key: CacheKey<R>
	data: R
}

const appliedCache = new WeakMap<object, CacheEntry<unknown>>()

export interface LayerState {
	patch: Patch
}

/**
 * Given a root object and a collection of layers, apply all layers appropriate
 * given the provided state.
 */
export function getAppliedData<R extends object>({root, layers, state}: {
	root: R,
	layers: Array<Layer<R>>,
	state: LayerState
}) {
	const entry = appliedCache.get(root) as CacheEntry<R> | undefined
	const key: CacheKey<R> = {
		patch: state.patch.key,
	}

	if (entry != null && cacheKeysMatch(entry.key, key)) {
		return entry.data
	}

	const applied = layers
		.filter(layer => shouldApplyLayer(layer, state))
		.reduce(applyLayer, root)

	appliedCache.set(root, {key, data: applied})

	return applied
}

export function getActions(report: Report) {
	const patch = new Patch(report.edition, report.timestamp / 1000)
	return getAppliedData({root: actionRoot, layers: actionLayers, state: {patch: patch}})
}

export function getStatuses(report: Report) {
	const patch = new Patch(report.edition, report.timestamp / 1000)
	return getAppliedData({root: statusRoot, layers: statusLayers, state: {patch: patch}})
}

const cacheKeysMatch = <R>(cached: CacheKey<R>, request: CacheKey<R>) =>
	cached.patch === request.patch

const shouldApplyLayer = <R>(layer: Layer<R>, state: LayerState) =>
	state.patch.compare(layer.patch) >= 0
