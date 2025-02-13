import _ from 'lodash'
import * as TB from 'ts-toolbelt'
import {Compute} from 'utilities'
import {FILTER_TYPE} from './Dispatcher'

// -----
// #region Core filter logic
// ----

type FilterState<Current> = {
	type?: string
	current: Current,
}

const proxyInner = (() => { /* unused */ }) as object

const customiser: _.isMatchWithCustomizer = (objValue, filterValue) => {
	// TODO: This effectively means we can't match against a function, but I'm not sure
	// that's really a _problem_. If it _is_, can mark it with a unique symbol or something.
	if (typeof filterValue === 'function') {
		return filterValue(objValue)
	}
}

// Actual filter logic
const filterInternal = <Base, Current extends Partial<Base>>(state: FilterState<Current>) =>
	new Proxy(proxyInner, {
		// Property access generates a new filter with a narrowed Current, i.e.
		// filter<Base, {}>.key(value) results in current={[key]:value}
		get: (target, key) => {
			// If the filtered type is being requested, expose it.
			if (key === FILTER_TYPE) {
				return state.type
			}

			return (value: unknown) => {
				// Merge in the new property to match against
				const next: FilterState<Current & {[key: string]: unknown}> = {
					...state,
					current: {...state.current, [key]: value},
				}

				// Optimisation: If a simple type value is being set, sidechannel it for
				// bucketing by the dispatcher.
				if (key === 'type' && typeof value === 'string') {
					next.type = value
				}

				return filterInternal(next)
			}
		},

		// Calling the filter directly execute the filter on the value passed in
		// the first argument. The exposed return type is a predicate.
		apply: (target, thisArg, [toCheck]) => {
			return _.isMatchWith(toCheck, state.current, customiser)
		},
	}) as Filter<Base, Current>

/** Create a filter builder for the shape of Base. */
// This is just a pass-through to fitlerInternal for type wrangling purposes.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const filter = <Base>() => filterInternal<Base, {}>({current: {}})

// -----
// #endregion
// #region Matchers
// -----

// Extending primitive so TS narrows the type as far as it can
/** Match successfully if value matches any of the provided values by reference.  */
export function oneOf<T extends TB.Misc.Primitive>(values: T[] | Set<T>): Matcher<T> {
	const set = Array.isArray(values) ? new Set(values) : values
	return (objValue): objValue is T => set.has(objValue)
}

// TODO: the type guard on this isn't... quite right.
/** Match successfully if value matches none of the provided values by reference.  */
export function noneOf<T extends TB.Misc.Primitive>(values: T[] | Set<T>): Matcher<T> {
	const set = Array.isArray(values) ? new Set(values) : values
	return (objValue): objValue is T => !set.has(objValue)
}

// This will technically always return true in a filter due to lodash semantics, but hey
/** Match successfully if value is not nullish. */
export const exists = <T>(value?: T | null): value is T => value != null

// -----
// #endregion
// #region Filter types
// -----
/*
-------------------------------- W A R N I N G --------------------------------
While I've tried to document it as best I can, the "code" below is some pretty
hefty typescript generic shenanigans that power and strongly-type the proxy
magic above. If you just want to use the filter as a consumer, I'd recommend
not reading any further.

That said, if you're interested in how it works, have a read! Let me know if
you've got any questions or anything, I spent quite a bit on time on this, and
I'd be more than happy to explain how it works!
-------------------------------------------------------------------------------
*/

// For the given Union, resolve to union of keys of all members
type DistributedKeyof<Union> = Union extends unknown ? keyof Union : never

// For the given Union of Objects, select members that contain key Key with any value
type HasKey<Union, Key extends DistributedKeyof<Union>> =
	Union extends unknown
		? Required<Union> extends {[_ in Key]: unknown}
			? Union
			: never
		: never

// Resolve Value to the loosest type matching the type of each Shape at Key
type ResolveValue<Value, Shape, Key extends keyof Shape> =
	Shape extends unknown
	? Value extends Shape[Key] ? Shape[Key] : never
	: never

// Matchers are predicate functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Matcher<Type> = (input: any) => input is Type

type FilteredBase<Base, Current extends Partial<Base>> =
	Extract<Required<Base>, Current>

// Build a filter object for Base, given constraints in Current
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Filter<Base, Current extends Partial<Base> = {}> =
	// Chaining builder methods
	& {
		// Map over all keys that remain valid in Base when constrained by Current,
		// omitting any that are already present in Current.
		[Key in Exclude<
			DistributedKeyof<FilteredBase<Base, Current>>,
			keyof Current
		>]:
			// Require function parameter is, or is a matcher for, the type of the Key
			// in Base when constrained by Current.
			<Value extends HasKey<FilteredBase<Base, Current>, Key>[Key]>
			(_value: Value | Matcher<Value>)
			// Return a new Filter that incorporates the loosest representation of
			// Key's Value into the new Current.
			=> Filter<Base, Compute<
				& Current
				& {
					[_ in Key]: ResolveValue<Value, HasKey<FilteredBase<Base, Current>, Key>, Key>
				}
			>>
	}
	// Filter type side channel
	& {[FILTER_TYPE]?: string}
	// Call signature for the filter
	& {(value: Base): value is Compute<TB.Union.Select<Required<Base>, Current>>}

// -----
// #endregion
// -----
