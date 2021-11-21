export const isDefined = <T>(val?: T | null): val is T => val != null

export function ensureArray<T>(val: T | readonly T[]): readonly T[] {
	if (!Array.isArray(val)) {
		return [val as T]
	}
	return val // need to add a .slice() here if we want the return to be T[]
}

type SortaEnum = Record<string|number, string|number>
/**
 * Create reverse key<->value mappings for an object and then freeze it to prevent further modifications.
 * @param {*KeyValue object to reverse map} obj
 * @deprecated Use typescript if you want real enums plsthank
 */
export function enumify(obj: SortaEnum): Readonly<SortaEnum> {
	for (const [key, val] of Object.entries(obj)) {
		obj[val] = key
	}
	return Object.freeze(obj)
}

/**
 * Ensure that the values in the provided record match at _least_ the requested data shape.
 *
 * @example
 * ```ts
 * interface Data { example: number }
 * const data = ensureRecord<Data>()({KEY: {example: 1}})
 * ```
 */
export const ensureRecord =
	<TData, TIssues extends keyof TData = never>() =>
	<TInput extends Record<string, TData>>(values: TInput): {
		[K in keyof TInput]: ReplaceFrom<TInput[K] & TData, TData, TIssues>
	} => values

// Type utilities, some partially stole from ts-toolbelt. Maybe I should just add it...

/**
 * Replace in `Target` the prop types from `Source` specified in `Props`
 */
export type ReplaceFrom<Target, Source, Props extends keyof Source> =
	Omit<Target, Props> & {[K in Props]: Source[K]}

/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-explicit-any */
/** Force typescript to compute a type for display purposes. */
export type Compute<A extends any> =
	A extends Function? A : {[K in keyof A]: A[K]} & {}
/* eslint-enable @typescript-eslint/ban-types,@typescript-eslint/no-explicit-any */

/*
The below is a collection of types used to create a "backfilled" union - that is, a
union of types where all _invalid_ keys that are defined elsewhere in the union are
typed as `?:never`, allowing us to discriminate on any possible union property.
With thanks to https://github.com/microsoft/TypeScript/issues/20863#issuecomment-520551758
*/

// For a given union U, return all possible keys available on members
type UnionKeys<U> = U extends unknown ? keyof U : never

// For the union of keys K, return an object type with each member optionally typed to never
type InvalidKeys<K extends string | number | symbol> = { [P in K]?: never }

// For each member of union U, add all _other_ possible keys available within U as InvalidKeys
type BackfillUnionInternal<U, UAll> =
	U extends unknown
		? U & InvalidKeys<Exclude<UnionKeys<UAll>, keyof U>>
		: never

// Helper type used to duplicate the union U for use in the type above
export type BackfillUnion<U> = BackfillUnionInternal<U, U>
