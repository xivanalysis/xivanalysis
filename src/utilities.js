import {matchPath} from 'react-router-dom'
import LANGUAGES, {SHORT_LANGUAGE_MAP, DEFAULT_LANGUAGE} from 'data/LANGUAGES'

export const addExtraIndex = (obj, index) => {
	Object.keys(obj).forEach(key => {
		const val = obj[key]
		let newKey = val[index]
		if (!Array.isArray(newKey)) {
			newKey = [newKey]
		}
		newKey.forEach(key => obj[key] = val)
	})
	return obj
}

// This is pretty damn nasty, but it'll do for now
export const getPathMatch = pathname => {
	const page = matchPath(pathname, '/:page?')

	let path = '/'
	switch (page.params.page) {
	case 'find':    path = '/find/:code/:fight?'; break
	case 'analyse': path = '/analyse/:code/:fight/:combatant'; break
	default:        // Do nothing
	}

	return matchPath(pathname, path)
}

export const compose = (...fns) => fns.reduce(
	(f, g) => (...args) => f(g(...args))
)

/**
 * Create reverse key<->value mappings for an object and then freeze it to prevent further modifications.
 * @param {*KeyValue object to reverse map} obj
 */
export function enumify(obj) {
	for (const [key, val] of Object.entries(obj)) {
		obj[val] = key
	}
	return Object.freeze(obj)
}

/**
 * Extract primitive values from an object for inclusion in
 * an error report via Sentry.
 * @param {Object} object The object to extra data from.
 * @returns {Object} Data that should be safe to JSON encode.
 */
export function extractErrorContext(object) {
	const result = {}

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
			result[key] = val
			break

		default:
			break
		}
	}

	return result
}

function _matchClosestHoF(difference) {
	return (values, value) => {
		const isArray = Array.isArray(values)
		const isObject = typeof values === typeof {}

		if (!isArray && !isObject) {
			return
		}

		const workingValues = isArray ?
			values :
			isObject ?
				Object.keys(values) :
				[]

		let closestIndex
		let closest

		workingValues
			.map(v => difference(v, value))
			.forEach((currentValue, currentIndex) => {
				if (currentValue >= 0 && (typeof closest === typeof undefined || currentValue < closest)) {
					closest = currentValue
					closestIndex = currentIndex
				}
			})

		if (isArray) {
			return workingValues[closestIndex]
		}

		if (isObject) {
			return values[workingValues[closestIndex]]
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

// Renders a time given in seconds into the format mm:ss
export function formatDuration(duration) {
	/* eslint-disable no-magic-numbers */
	const seconds = Math.floor(duration % 60)
	return `${Math.floor(duration / 60)}:${seconds < 10? '0' : ''}${seconds}`
	/* eslint-enable no-magic-numbers */
}

/**
 * Get a slice of a string up until the first instance of a sub-string.
 * @param {String} haystack The string to slice
 * @param {String} needle The sub-string to search for
 * @returns {String} All of string before needle
 */
export function stringBefore(haystack, needle) {
	const idx = haystack.indexOf(needle)
	return idx === -1 ? haystack : haystack.slice(0, idx)
}

/**
 * Iterate over a list of languages and return the first matching, enabled language.
 * Returns the default language if none match.
 * @param {String[]} [languages] An array of languages to check, defaults to `navigator.languages`
 * @returns {String} Language Code
 */
export function getUserLanguage(languages = null) {
	if (!languages) {
		if (Array.isArray(navigator.languages)) {
			languages = navigator.languages
		} else {
			languages = [navigator.language]
		}
	}

	for (const lang of languages) {
		if (LANGUAGES[lang] && LANGUAGES[lang].enable) {
			return lang
		}
	}

	// In case we didn't get a match, try matching just the first part of each
	// language. It's better than falling  back to nothing. This may be overkill.
	for (const lang of languages.map(l => stringBefore(l, '-'))) {
		const match = SHORT_LANGUAGE_MAP[lang]
		if (LANGUAGES[match] && LANGUAGES[match].enable) {
			return match
		}
	}

	return DEFAULT_LANGUAGE
}
