import {Action, root as ACTION} from 'data/ACTIONS'
import {ActionRoot} from 'data/ACTIONS/root'
import {RoleKey} from 'data/JOBS'
import {Status, root as STATUS} from 'data/STATUSES'
import {StatusRoot} from 'data/STATUSES/root'

export const OPTIMAL_ROLES: {
	MELEE: {
		ROLE: RoleKey[],
		ACTION: Array<keyof ActionRoot>,
		STATUS: Array<keyof StatusRoot>,
	},
	RANGED: {
		ROLE: RoleKey[],
		ACTION: Array<keyof ActionRoot>,
		STATUS: Array<keyof StatusRoot>,
	}
} = {
	MELEE: {
		ROLE: [
			'TANK',
			'MELEE',
		],
		ACTION: [
			'THE_BALANCE',
			'THE_ARROW',
			'THE_SPEAR',
		],
		STATUS: [
			'THE_BALANCE',
			'THE_ARROW',
			'THE_SPEAR',
		],
	},
	RANGED: {
		ROLE: [
			'HEALER',
			'MAGICAL_RANGED',
			'PHYSICAL_RANGED',
		],
		ACTION: [
			'THE_BOLE',
			'THE_EWER',
			'THE_SPIRE',
		],
		STATUS: [
			'THE_BOLE',
			'THE_EWER',
			'THE_SPIRE',
		],
	},
}

export function optimalRoleVerify(role: RoleKey, card: Status['id'] | Action['id']) {
	//this was created as a separate function since I used it in multiple places

	const meleeCardsAction = OPTIMAL_ROLES.MELEE.ACTION.map(actionKey => ACTION[actionKey].id)
	const rangedCardsAction = OPTIMAL_ROLES.RANGED.ACTION.map(actionKey => ACTION[actionKey].id)
	const meleeCardsStatus = OPTIMAL_ROLES.MELEE.STATUS.map(statusKey => STATUS[statusKey].id)
	const rangedCardsStatus = OPTIMAL_ROLES.RANGED.STATUS.map(statusKey => STATUS[statusKey].id)

	if (!(OPTIMAL_ROLES.MELEE.ROLE.includes(role) || OPTIMAL_ROLES.RANGED.ROLE.includes(role))) { return undefined }
	const optimalRole: boolean =
		(OPTIMAL_ROLES.MELEE.ROLE.includes(role) && (meleeCardsStatus.includes(card) || meleeCardsAction.includes(card)))
			|| (OPTIMAL_ROLES.RANGED.ROLE.includes(role) && (rangedCardsStatus.includes(card) || rangedCardsAction.includes(card)))

	return optimalRole

}
