import {ensureArray} from 'utilities'

/*
WeakMap<
	DATA object,
	Map<
		Property being used for lookup,
		Map<
			Value for provided property,
			DATA entries
		>
	>
>
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new WeakMap<object, Map<any, Map<any, any[]>>>()

type FlattenArray<T> = T extends Array<infer I> ? I : T

export function getDataArrayBy<
	Data extends Record<string, object>,
	Entry extends Data[keyof Data],
	Key extends keyof Entry,
>(
	data: Data,
	by: Key,
	value: FlattenArray<Entry[Key]>,
): Entry[] {
	const dataKeys = Object.keys(data)

	// Pull up the cache for the given data object, creating a new one if none exists
	let dataCache = cache.get(data)
	if (!dataCache) {
		dataCache = new Map()
		cache.set(data, dataCache)
	}

	// Try to obtain a lookup map within the cache for the given property
	let lookup = dataCache.get(by)

	// If there isn't a lookup map, build one
	if (lookup == null) {
		lookup = dataKeys.reduce((map, key) => {
			const entry = data[key] as Entry
			const value = entry[by]

			// If the entry does not contain data for the key, we can skip it
			if (value == null) {
				return map
			}

			// Keys can be arrays (see STATUSES), handle it
			const values = ensureArray(value)
			values.forEach(value => {
				let entries = map.get(value)
				if (entries == null) {
					entries = []
					map.set(value, entries)
				}
				entries.push(entry)
			})
			return map
		}, new Map<Entry[Key], Entry[]>())

		dataCache.set(by, lookup)
	}

	return lookup.get(value) ?? []
}

export function getDataBy<
	Data extends Record<string, object>,
	Entry extends Data[keyof Data],
	Key extends keyof Entry,
>(
	data: Data,
	by: Key,
	value: FlattenArray<Entry[Key]>,
): Entry | undefined {
	return getDataArrayBy(data, by, value)[0]
}
