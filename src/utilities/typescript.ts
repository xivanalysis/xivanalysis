export const isDefined = <T>(val?: T | null): val is T => val != null

export function ensureArray<T>(val: T | ReadonlyArray<T>): ReadonlyArray<T> {
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
