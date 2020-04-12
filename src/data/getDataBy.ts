import {ensureArray} from 'utilities'

/*
WeakMap<
	DATA object,
	Map<
		Property being used for lookup,
		Map<
			Value for provided property,
			DATA entry
		>
	>
>

You didn't see the anys.
*/
const cache = new WeakMap<object, Map<any, Map<any, any>>>()

type FlattenArray<T> = T extends Array<infer I> ? I : T

export function getDataBy<
	Data extends Record<string, object>,
	Value extends Data[keyof Data],
	Key extends keyof Value,
>(
	data: Data,
	by: Key,
	value: FlattenArray<Value[Key]>,
): Value | undefined {
	// Sanity check in case someone is using this from JS and misspelled a key
	const dataKeys = Object.keys(data)
	const testEntry = data[dataKeys[0]]
	if (!testEntry.hasOwnProperty(by)) {
		const correctKeys = Object.keys(testEntry).join('|')
		throw new Error(`Invalid 'by' value provided: got '${by}', expected '${correctKeys}'`)
	}

	// Pull up the cache for the given data object, creating a new one if none exists
	let dataCache = cache.get(data)
	if (!dataCache) {
		dataCache = new Map()
		cache.set(data, dataCache)
	}

	// Try to obtain a lookup map within the cache for the given property
	let lookup = dataCache.get(by)

	// If there isn't a lookup map, build one
	if (!lookup) {
		lookup = dataKeys.reduce((map, key) => {
			const val = data[key] as Value

			// Keys can be arrays (see STATUSES), handle it
			const newKeys = ensureArray(val[by])
			newKeys.forEach(key => map.set(key, val))

			return map
		}, new Map<Value[Key], Value>())

		dataCache.set(by, lookup)
	}

	return lookup.get(value)
}
