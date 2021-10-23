import {StatusRoot} from 'data/STATUSES/root'
import {Attribute} from 'event'
import {Compute, ReplaceFrom} from 'utilities/typescript'

export type ActionCombo =
	& (
		| {start: true, from?: never}
		| {from: number | number[], start?: never}
	)
	& {end?: true}

export interface Action {
	id: number
	name: string
	icon: string
	onGcd?: boolean
	breaksCombo?: boolean
	combo?: ActionCombo
	castTime?: number
	cooldown?: number
	gcdRecast?: number
	cooldownGroup?: number
	autoAttack?: boolean
	statusesApplied?: Array<keyof StatusRoot>
	charges?: number
	mpCost?: number
	/** Indicate whether this action's recast is adjusted by skill speed or spell speed.  Should be set for any onGCD skill or gcd-like skill that has a reduced recast based on speed stats */
	speedAttribute?: Attribute.SKILL_SPEED | Attribute.SPELL_SPEED
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureActions = <T extends Record<string, Action>>(actions: T): EnsuredActions<T> => actions as any // trust me
