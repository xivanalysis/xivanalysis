/**
 * Extract primitive values from an object for inclusion in
 * an error report via Sentry.
 * @param {Object} object The object to extra data from.
 * @returns {Object} Data that should be safe to JSON encode.
 */
export function extractErrorContext(object: any): object {
	const result: Record<string, string|number|boolean|null> = {}

	for (const [key, val] of Object.entries(object)) {
		switch (typeof val) {
		case 'object':
			if (val == null) {
				result[key] = val

			} else if (Array.isArray(val)) {
				result[key] = `::Array(${val.length})`

			} else if (val.constructor === Object) {
				result[key] = '::Object'
			}

			break

		case 'string':
		case 'number':
		case 'boolean':
			result[key] = val as string|number|boolean
			break

		default:
			break
		}
	}

	return result
}
