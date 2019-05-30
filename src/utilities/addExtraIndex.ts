import {ensureArray} from './typescript'

export function addExtraIndex<T extends Record<string, object>, K extends keyof T[keyof T]>(obj: T, index: K) {
	const result = obj as T & Record<number, T[keyof T]>
	Object.keys(obj).forEach(key => {
		const val = obj[key as keyof T]
		const newKey = ensureArray(val[index])
		newKey.forEach(key => result[key as any as number] = val)
	})
	return result
}
