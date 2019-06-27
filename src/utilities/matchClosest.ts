function _matchClosestHoF(difference: (a: number, b: number) => number) {
	return matcher

	function matcher(values: ReadonlyArray<number>, value: number): number | undefined
	function matcher<T>(values: Record<number, T>, value: number): T | undefined
	function matcher(values: ReadonlyArray<number>|Record<number, any>, value: any) {
		const isArray = Array.isArray(values)
		const isObject = typeof values === typeof {}

		if (!isArray && !isObject) {
			return
		}

		const workingValues: ReadonlyArray<number|string> = isArray ?
			values as ReadonlyArray<number> :
			isObject ?
				Object.keys(values) :
				[]

		let closestIndex: number|undefined
		let closest: number|undefined

		workingValues
			.map(v => difference(+v, value))
			.forEach((currentValue, currentIndex) => {
				if (currentValue >= 0 && (closest === undefined || currentValue < closest)) {
					closest = currentValue
					closestIndex = currentIndex
				}
			})

		if (closestIndex === undefined) {
			return
		}

		if (isArray) {
			return workingValues[closestIndex]
		}

		if (isObject) {
			return values[+workingValues[closestIndex]]
		}
	}
}

/**
 * Matches to the closest nearby number of an Array or the Keys of an Object and returns the representative value.
 * @param values {Array|Object} Array of values to match or Object with keys (have to be numeric) to match.
 * @param value {Number} Number to match.
 * @returns {*} Matched value of the Array or Value of the matched Key in the Object or undefined if no match.
 */
export const matchClosest = _matchClosestHoF((value, baseValue) => Math.abs(value - baseValue))

/**
 * Matches to the closest lower number of an Array or the Keys of an Object and returns the representative value.
 * @param values {Array|Object} Array of values to match or Object with keys (have to be numeric) to match.
 * @param value {Number} Number to match.
 * @returns {*} Matched value of the Array or Value of the matched Key in the Object or undefined if no match.
 */
export const matchClosestLower = _matchClosestHoF((value, baseValue) => baseValue - value)

/**
 * Matches to the closest higher number of an Array or the Keys of an Object and returns the representative value.
 * @param values {Array|Object} Array of values to match or Object with keys (have to be numeric) to match.
 * @param value {Number} Number to match.
 * @returns {*} Matched value of the Array or Value of the matched Key in the Object or undefined if no match.
 */
export const matchClosestHigher = _matchClosestHoF((value, baseValue) => value - baseValue)
