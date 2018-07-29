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
		enable: false,
	},
	fr: {
		menu: {
			text: 'Français',
			flag: 'fr',
		},
		tooltip: 'fr',
		enable: false,
	},
	de: {
		menu: {
			text: 'Deutsch',
			flag: 'de',
		},
		tooltip: 'de',
		enable: false,
	},
}

export const LANGUAGE_ARRAY = Object.entries(LANGUAGES)
	.map(([key, val]) => {
		val.value = key
		if (val.menu) {
			val.menu.value = key
		}
		return val
	})

export default LANGUAGES

export const DEFAULT_LANGUAGE = 'en'
