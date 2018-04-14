
export const addExtraIndex = (obj, index) => {
	Object.keys(obj).forEach(key => {
		const val = obj[key]
		obj[val[index]] = val
	})
	return obj
}
