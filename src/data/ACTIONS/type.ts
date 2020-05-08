import {StatusRoot} from 'data/STATUSES/root'
import {Compute, ReplaceFrom} from 'utilities/typescript'

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
	statusesApplied?: Array<keyof StatusRoot>
	charges?: number
	mpCost?: number
	// TODO: Do I need this still?
	// [key: string]: unknown
}

/*
	The properties defined here get narrowed too much by the `ensureActions`
	generic by default - we use some TS magic to forcefully widen them again.
	Expect to add this when dealing with top-level arrays.
*/
type TroublesomeProperties = 'statusesApplied'

type EnsuredActions<T extends Record<string, Action>> = {
	[K in keyof T]: Compute<ReplaceFrom<T[K] & Action, Action, TroublesomeProperties>>
}

export const ensureActions = <T extends Record<string, Action>>(actions: T): EnsuredActions<T> => actions as any // trust me
