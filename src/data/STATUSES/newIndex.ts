import {applyLayer, LayerData} from 'data/layer'
import {layers} from './layers'
import {root, StatusRoot} from './root'

export const STATUS_ID_OFFSET = 1000000

/**
 * Presumably because WoW statuses and spells share the same ID space, FFLogs adds 1m to every status ID.
 * I'm not gonna get everyone to do that in here, so just automating it.
 */
function correctIdsToMatchLogs(statuses: StatusRoot): StatusRoot
function correctIdsToMatchLogs(statuses: LayerData<StatusRoot>): LayerData<StatusRoot>
function correctIdsToMatchLogs(statuses: LayerData<StatusRoot> | StatusRoot) {
	const keys = Object.keys(statuses) as Array<keyof typeof statuses>
	return keys.reduce(
		(acc, key) => {
			const status = acc[key]
			if (!status?.id) { return acc }
			// TODO: How am I going to handle the bloody multi-id things?
			acc[key] = {...status, id: status.id + STATUS_ID_OFFSET}
			return acc
		},
		{...statuses},
	)
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

// Everything below here is temp back compat
// need to export a collated everything-applied as default for back compat
const collated = correctedLayers.reduce(applyLayer, correctedRoot)

// in dev, maybe proxy the collated and print warnings so we can aim towards 0?

export default collated
