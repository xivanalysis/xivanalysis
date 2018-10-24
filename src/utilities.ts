import compose from 'lodash/fp/compose'
import {matchPath} from 'react-router-dom'

import LANGUAGES, {DEFAULT_LANGUAGE, SHORT_LANGUAGE_MAP} from 'data/LANGUAGES'

export {compose}

function ensureArray<T>(val: T | ReadonlyArray<T>): ReadonlyArray<T> {
	if (!Array.isArray(val)) {
		return [val as T]
	}
	return val // need to add a .slice() here if we want the return to be T[]
}

export function addExtraIndex<T extends Record<string, object>, K extends keyof T[keyof T]>(obj: T, index: K) {
	const result = obj as T & Record<number, T[keyof T]>
	Object.keys(obj).forEach(key => {
		const val = obj[key as keyof T]
		const newKey = ensureArray(val[index])
		newKey.forEach(key => result[key as any as number] = val)
	})
	return result
}

// This is pretty damn nasty, but it'll do for now
export function getPathMatch(pathname: string) {
	const page = matchPath<{ page: string }>(pathname, {path: '/:page?'})

	let path = '/'
	switch (page !== null && page.params.page) {
	case 'find':    path = '/find/:code/:fight?'; break
	case 'analyse': path = '/analyse/:code/:fight/:combatant'; break
	default:        // Do nothing
	}

	return matchPath(pathname, {path})
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

function _matchClosestHoF(difference: (a: number, b: number) => number) {
	return matcher

	function matcher(values: ReadonlyArray<number>, value: number): number
	function matcher<T>(values: Record<number, T>, value: number): T
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

		if (isArray) {
			return workingValues[closestIndex!]
		}

		if (isObject) {
			return values[+workingValues[closestIndex!]]
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
export function formatDuration(duration: number) {
	/* tslint:disable:no-magic-numbers */
	const seconds = Math.floor(duration % 60)
	return `${Math.floor(duration / 60)}:${seconds < 10? '0' : ''}${seconds}`
	/* tslint:enable:no-magic-numbers */
}

/**
 * Get a slice of a string up until the first instance of a sub-string.
 * @param {String} haystack The string to slice
 * @param {String} needle The sub-string to search for
 * @returns {String} All of string before needle
 */
export function stringBefore(haystack: string, needle: string) {
	const idx = haystack.indexOf(needle)
	return idx === -1? haystack : haystack.slice(0, idx)
}

function getNavigatorLanguages(): ReadonlyArray<string> {
	if (Array.isArray(navigator.languages)) {
		return navigator.languages
	}
	return [navigator.language]
}

/**
 * Iterate over a list of languages and return the first matching, enabled language.
 * Returns the default language if none match.
 * @param {String[]} [languages] An array of languages to check, defaults to `navigator.languages`
 * @returns {String} Language Code
 */
export function getUserLanguage(languagesInput: ReadonlyArray<string> = getNavigatorLanguages()): string {
	const languages = languagesInput.filter((lang): lang is keyof typeof LANGUAGES => lang in LANGUAGES)
	for (const lang of languages) {
		if (LANGUAGES[lang].enable) {
			return lang
		}
	}

	// In case we didn't get a match, try matching just the first part of each
	// language. It's better than falling  back to nothing. This may be overkill.
	for (const lang of languages.map(l => stringBefore(l, '-'))) {
		const match = SHORT_LANGUAGE_MAP[lang]
		if (match && LANGUAGES[match].enable) {
			return match
		}
	}

	return DEFAULT_LANGUAGE
}
