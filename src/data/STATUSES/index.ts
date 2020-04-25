import {applyLayer, LayerData} from 'data/layer'
import {layers} from './layers'
import {root, StatusRoot} from './root'
import {Status} from './type'

export const STATUS_ID_OFFSET = 1000000

/**
 * Presumably because WoW statuses and spells share the same ID space, FFLogs adds 1m to every status ID.
 * I'm not gonna get everyone to do that in here, so just automating it.
 */
function correctIdsToMatchLogs(statuses: StatusRoot): StatusRoot
function correctIdsToMatchLogs(statuses: LayerData<StatusRoot>): LayerData<StatusRoot>
function correctIdsToMatchLogs(statuses: LayerData<StatusRoot> | StatusRoot) {
	const applied = {...statuses}
	const keys = Object.keys(applied) as Array<keyof typeof applied>
	keys.forEach(key => {
		const status = applied[key]
		if (!status?.id) { return }
		// Cast is required to prevent TS literally freaking out
		(applied[key] as Partial<Status>) = {...status, id: status.id + STATUS_ID_OFFSET}
	})
	return applied
}

const correctedRoot = correctIdsToMatchLogs(root)
const correctedLayers = layers.map(layer => ({
	...layer,
	data: correctIdsToMatchLogs(layer.data),
}))

export {
	correctedRoot as root,
	correctedLayers as layers,
}
export type {Status}

// Everything below here is temp back compat
// need to export a collated everything-applied as default for back compat
// TODO: Need to consider how data can cross-reference under the layered system - what if an ID changes? (Because of course they do)
//       Referencing via string of the root key seems like a sane option - it's guaranteed to exist, and track alongside changes from layers
const collated = correctedLayers.reduce(applyLayer, correctedRoot)
export default collated
