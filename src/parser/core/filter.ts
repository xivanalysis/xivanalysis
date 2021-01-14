import _ from 'lodash'
import * as TB from 'ts-toolbelt'

const proxyInner = (() => { /* unused */ }) as object

const customiser: _.isMatchWithCustomizer = (objValue, filterValue) => {
	// TODO: This effectively means we can't match against a function, but I'm not sure
	// that's really a _problem_. If it _is_, can mark it with a unique symbol or something.
	if (typeof filterValue === 'function') {
		return filterValue(objValue)
	}
}

// Actual filter logic
const filterInternal = <Base, Current extends Partial<Base>>(current: Current) =>
	new Proxy(proxyInner, {
		// Property access generates a new filter with a narrowed Current, i.e.
		// filter<Base, {}>.key(value) results in current={[key]:value}
		get: (target, key) =>
			(value: unknown) =>
				filterInternal({...current, [key]: value}),

		// Calling the filter directly execute the filter on the value passed in
		// the first argument. The exposed return type is a predicate.
		apply: (target, thisArg, [toCheck]) => _.isMatchWith(toCheck, current, customiser),
	}) as Filter<Base, Current>

/** Create a filter builder for the shape of Base. */
// This is just a pass-through to fitlerInternal for type wrangling purposes.
export const filter = <Base>() => filterInternal<Base, {}>({})

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

// For union BaseValues, select members which Value extends
type SelectMatchingBases<BaseValues, Value> =
	BaseValues extends unknown
		? Value extends BaseValues
			? BaseValues
			: never
		: never

// Resolve Value to the loosest type matching the type of each Shape at Key
// The actual logic of this resolution is primarily encapsulated in SelectMatchingBases,
// This is effectively a wrapper to handle the special case of boolean widening
type ResolveValue<Value, Shape, Key extends keyof Shape> =
	Shape extends unknown ?
		// If boolean extends the target, then the target contains at least a full
		// boolean union. If it does, and Value is at least partially boolean, widen
		// to the full type.
		boolean extends Shape[Key] ? Value extends boolean ? boolean
		// Otherwise, fall back to the non-special cased check
		: SelectMatchingBases<Shape[Key], Value>
		: SelectMatchingBases<Shape[Key], Value>
	: never

// Matchers are predicate functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Matcher<Type> = (input: any) => input is Type

// Build a filter function for Key in Base, given constraints in Current
type FilterFunction<
	Base,
	Current extends Partial<Base>,
	Key extends DistributedKeyof<Base>
> = (
	// Resolve WithKey to members of Base constrained by Current that contain Key
	// Constrain parameter to types permitted on the above via Value.
	// Return a new filter, passing down base and extending current with the resolved Value.
	<
		WithKey extends HasKey<TB.Union.Select<Required<Base>, Current>, Key>,
		Value extends WithKey[Key]
	>(
		_value: Value | Matcher<Value>
	) => (
		Filter<Base, TB.Any.Compute<
			& Current
			& {[_ in Key]: ResolveValue<Value, WithKey, Key>}
		>>
	)
)

// Build a filter object for Base, given constraints in Current
export type Filter<Base, Current extends Partial<Base> = {}> =
	// Chaining builder methods
	& {
		[Key in Exclude<
			DistributedKeyof<TB.Union.Select<Required<Base>, Current>>,
			keyof Current
		>]:
		// @ts-expect-error TS is failing to infer that Select is creating a subset
		FilterFunction<Base, Current, Key>
	}
	// Call signature for the filter
	& {(value: Base): value is TB.Any.Compute<TB.Union.Select<Required<Base>, Current>>}
