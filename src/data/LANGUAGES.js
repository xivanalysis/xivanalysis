const LANGUAGES = {
	en: {
		text: 'English',
		flag: 'gb',
		tooltip: 'en',
	},
	ja: {
		text: '日本語',
		flag: 'jp',
		tooltip: 'ja',
	},
	fr: {
		text: 'Français',
		flag: 'fr',
		tooltip: 'fr',
	},
	de: {
		text: 'Deutsch',
		flag: 'de',
		tooltip: 'de',
	},
}

export const LANGUAGE_ARRAY = Object.entries(LANGUAGES)
	.map(([key, val]) => {
		val.value = key
		return val
	})

export default LANGUAGES

export const DEFAULT_LANGUAGE = 'en'
