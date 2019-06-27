import {DEFAULT_LANGUAGE, Language, LANGUAGES} from 'data/LANGUAGES'
import {stringBefore} from './strings'

// TODO: Most of the below shouldn't really be in utilities

const SHORT_LANGUAGE_MAP = Object.keys(LANGUAGES).reduce(
	(carry, key) => {
		carry[stringBefore(key, '-')] = key as Language
		return carry
	},
	{} as Record<string, Language>,
)

function getNavigatorLanguages(): ReadonlyArray<string> {
	if (Array.isArray(navigator.languages)) {
		return navigator.languages
	}
	return [navigator.language]
}

/**
 * Iterate over a list of languages and return the first matching, enabled language.
 * Returns the default language if none match.
 * @param {String[]} [languagesInput] An array of languages to check, defaults to `navigator.languages`
 * @returns {String} Language Code
 */
export function getUserLanguage(languagesInput: ReadonlyArray<string> = getNavigatorLanguages()): Language {
	const languages = languagesInput.filter((lang): lang is Language => lang in LANGUAGES)
	for (const lang of languages) {
		if (LANGUAGES[lang].enable) {
			return lang
		}
	}

	// In case we didn't get a match, try matching just the first part of each
	// language. It's better than falling back to nothing. This may be overkill.
	for (const lang of languages.map(l => stringBefore(l, '-'))) {
		const match = SHORT_LANGUAGE_MAP[lang]
		if (match && LANGUAGES[match].enable) {
			return match
		}
	}

	return DEFAULT_LANGUAGE
}
