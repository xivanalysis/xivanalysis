import {ActionRoot} from 'data/ACTIONS'
import {StatusRoot} from 'data/STATUSES'

export const CRIT_PARTY_MODIFIERS: Array<{status: keyof StatusRoot, strength: number}> = [
	//statuses that can be applied to any party members that impact the critical hit rate
	{status: 'BATTLE_LITANY', strength: 0.1},
	{status: 'DEVILMENT', strength: 0.2},
	{status: 'THE_WANDERERS_MINUET', strength: 0.02},
]

export const CRIT_ENEMY_MODIFIERS: Array<{status: keyof StatusRoot, strength: number}> = [
	//statuses that can be applied to any specific enemy that impact the critical hit rate
	{status: 'CHAIN_STRATAGEM', strength: 0.02},
]

export const DH_PARTY_MODIFIERS: Array<{status: keyof StatusRoot, strength: number}> = [
	//statuses that can be applied to any party members that impact the direct hit rate
	{status: 'ARMYS_PAEON', strength: 0.03},
	{status: 'BATTLE_VOICE', strength: 0.2},
	{status: 'DEVILMENT', strength: 0.2},
]

export const AUTO_CRIT_ABILITIES: Array<keyof ActionRoot> = [
	//actions that provide a critical hit no matter the modifier
	//note: these will be specifically excluded from the crit/DH calculation since they only skew the calculation
	'STARFALL_DANCE',
	'CHAOTIC_CYCLONE',
	'INNER_CHAOS',
	'PRIMAL_REND',
]

export const AUTO_DH_ABILITIES: Array<keyof ActionRoot> = [
	//actions that provide a direct hit no matter the modifier
	//note: these will be specifically excluded from the crit/DH calculation since they only skew the calculation
	'STARFALL_DANCE',
	'CHAOTIC_CYCLONE',
	'INNER_CHAOS',
	'PRIMAL_REND',
]

export const INERT_CRIT_DH: Array<keyof ActionRoot> = [
	//actions that do not crit nor DH
	'WILDFIRE',
]

export const GCD_CRIT_MODIFIER: Array<keyof StatusRoot> = [
	//statuses that only qualify for the next GCD, but not anything in between
	'REASSEMBLED',
	'LIFE_SURGE',
]

export const GCD_DH_MODIFIER: Array<keyof StatusRoot> = [
	//statuses that only qualify for the next GCD, but not anything in between
	'REASSEMBLED',
]

export const SPECIFIC_ACTION_MODIFIER: Array<{status: keyof StatusRoot, action: keyof ActionRoot, critModifier: number, DHModifier: number}> = [
	//statuses that are only applicable for specific actions or weaponskills while active
	//note: this status is typically consumed with the related action, but the treatment only happens while status is active
	{status: 'OPO_OPO_FORM', action: 'BOOTSHINE', critModifier: 1, DHModifier: 0},
	{status: 'OPO_OPO_FORM', action: 'SHADOW_OF_THE_DESTROYER', critModifier: 1, DHModifier: 0},
	{status: 'INNER_RELEASE', action: 'FELL_CLEAVE', critModifier: 1, DHModifier: 1},
	{status: 'INNER_RELEASE', action: 'DECIMATE', critModifier: 1, DHModifier: 1},
]
