import {Action, root as ACTION} from 'data/ACTIONS'
import {ActionRoot} from 'data/ACTIONS/root'
import {RoleKey} from 'data/JOBS'
import {Status, root as STATUS} from 'data/STATUSES'
import {StatusRoot} from 'data/STATUSES/root'

/*
* This module is used to verify whether the applicable job is one that would receive the 6% buff from the arcana cards for AST
*/

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

/**
* returns boolean to say whether the job would receive a 6% buff or 3% buff from the applicable card
*
* @param role {RoleKey} Role of the player ('Tank', 'Melee', 'Healer', etc.)
* @param card {Status['id'] | Action['id']} The status ID or action ID of the card played.
* @return optimalRole {boolean} returns boolean stating whether the job is technically optimal based on the card played.
*/
export function optimalRoleVerify(role: RoleKey, card: Status['id'] | Action['id']) {
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
