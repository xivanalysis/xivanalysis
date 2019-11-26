import {applyLayer} from 'data/layer'
import {layers} from './layers'
import {ActionRoot, ITEM_ID_OFFSET, root} from './root'
import {Action} from './type'

const DEFAULT_GCD_CASTTIME = 0
const DEFAULT_GCD_COOLDOWN = 2.5

// jank shit
// something about only adding to root, layers need to do themselves?
// does it make sense to do on layers? would essentially kludge any existing data if we did - the layer might not have (re)cast set, but the root might, so it'd set on the layer then override root
function addDefaultValues(actions: ActionRoot): ActionRoot {
	const applied = {...actions}
	const keys = Object.keys(applied) as Array<keyof typeof applied>
	keys.forEach(key => {
		const action = applied[key]
		if (!action.onGcd) { return }
		(applied[key] as Action) = {
			castTime: DEFAULT_GCD_CASTTIME,
			cooldown: DEFAULT_GCD_COOLDOWN,
			...action,
		}
	})
	return applied
}

const correctedRoot = addDefaultValues(root)

export {
	correctedRoot as root,
	layers,
	Action,
	ITEM_ID_OFFSET,
}

// Everything below here is temp back compat
// need to export a collated everything-applied as default for back compat
const collated = layers.reduce(applyLayer, correctedRoot)
export default collated
