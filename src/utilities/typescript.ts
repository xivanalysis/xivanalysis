export const isDefined = <T>(val?: T | null): val is T => val != null

export function ensureArray<T>(val: T | ReadonlyArray<T>): ReadonlyArray<T> {
	if (!Array.isArray(val)) {
		return [val as T]
	}
	return val // need to add a .slice() here if we want the return to be T[]
}

/**
 * Create reverse key<->value mappings for an object and then freeze it to prevent further modifications.
 * @param {*KeyValue object to reverse map} obj
 */
export function enumify<T extends Record<string|number, string|number>>(obj: T): Readonly<T> {
	for (const [key, val] of Object.entries(obj)) {
		obj[val] = key
	}
	return Object.freeze(obj)
}
