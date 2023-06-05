import {applyLayer, getAppliedData} from 'data/layer'
import {Patch} from 'data/PATCHES'
import {Report} from 'report'
import {layers} from './layers'
import {ActionRoot, ITEM_ID_OFFSET, root} from './root'
import {Action, BonusModifier, BaseModifier} from './type'

const DEFAULT_GCD_CASTTIME = 0
const DEFAULT_GCD_COOLDOWN = 2500

export type {ActionRoot}
export type ActionKey = keyof ActionRoot

/**
 * Adds default (re)cast times to GCD actions.
 * Note that this _only_ operates on the root data set. Actions that are changed to GCD in a layer
 * will need to specify (re)cast values manually, if they differ.
 */
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
	ITEM_ID_OFFSET,
}
export type {Action}

export function getActions(report: Report) {
	const patch = new Patch(report.edition, report.timestamp / 1000)
	return getAppliedData({root, layers, state: {patch: patch}})
}

export function getBasePotency(action: Action): number {
	return getPotencyWithMods(action, [], [])
}

export function getPotencyWithMods(action: Action, bonusModifiers: BonusModifier[], baseModifiers: BaseModifier[]) {
	return action.potencies?.find(
		potency =>
			JSON.stringify(potency.bonusModifiers.sort()) === JSON.stringify(bonusModifiers.sort()) &&
			JSON.stringify(potency.baseModifiers ? potency.baseModifiers.sort() : []) === JSON.stringify(baseModifiers.sort())
	)?.value || 0
}

// Everything below here is temp back compat
// need to export a collated everything-applied as default for back compat
const collated = layers.reduce(applyLayer, correctedRoot)
export default collated
