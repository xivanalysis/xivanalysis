import {stringBefore} from 'utilities'

const LANGUAGES = {
	en: {
		menu: {
			text: 'English',
			flag: 'gb',
		},
		tooltip: 'en',
		enable: true,
	},
	ja: {
		menu: {
			text: '日本語',
			flag: 'jp',
		},
		tooltip: 'ja',
		enable: true,
	},
	fr: {
		menu: {
			text: 'Français',
			flag: 'fr',
		},
		tooltip: 'fr',
		enable: true,
	},
	de: {
		menu: {
			text: 'Deutsch',
			flag: 'de',
		},
		tooltip: 'de',
		enable: true,
	},
}

export const LANGUAGE_ARRAY = Object.entries(LANGUAGES)
	.map(([key, val]) => {
		val.value = key
		if (val.menu) {
			val.menu.value = key
			val.menu.description = ((process.env.LOCALE_COMPLETION || {})[key] || '0') + '%'
		}
		return val
	})

export const SHORT_LANGUAGE_MAP = Object.keys(LANGUAGES).reduce(
	(x, key) => {
		x[stringBefore(key, '-')] = key
		return x
	},
	/** @type {Record<string, keyof typeof LANGUAGES | undefined>} */ ({})
)

export default LANGUAGES

export const DEFAULT_LANGUAGE = 'en'
