import {Status} from 'data/STATUSES'

interface ActionCombo {
	start?: boolean
	from?: number | number[]
	end?: boolean
}

export interface Action {
	id: number
	name: string
	icon: string
	onGcd?: boolean
	breaksCombo?: boolean
	combo?: ActionCombo
	castTime?: number
	cooldown?: number
	autoAttack?: boolean
	// TODO: Use key for layer compat
	statusesApplied?: Status[]
	// TODO: Do I need this still?
	// [key: string]: unknown
}

export const ensureActions = <T extends Record<string, Action>>(actions: T): {[K in keyof T]: T[K] & Action} => actions
