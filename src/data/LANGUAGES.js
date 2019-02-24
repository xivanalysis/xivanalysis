import {stringBefore} from 'utilities'
import {cloneDeep} from 'lodash'

const LANGUAGES = {
	en: {
		menu: {
			text: 'English',
			flag: 'gb',
		},
		enable: true,
		gameVersion: 'global',
	},
	ja: {
		menu: {
			text: '日本語',
			flag: 'jp',
		},
		enable: true,
		gameVersion: 'global',
	},
	fr: {
		menu: {
			text: 'Français',
			flag: 'fr',
		},
		enable: true,
		gameVersion: 'global',
	},
	de: {
		menu: {
			text: 'Deutsch',
			flag: 'de',
		},
		enable: true,
		gameVersion: 'global',
	},
}

export const LANGUAGE_ARRAY = Object.entries(LANGUAGES)
	.map(([key, obj]) => {
		const val = cloneDeep(obj)
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

export const GAME_LANGUAGES = Object.entries(LANGUAGES)
	.map(([key, val]) => val.enable && val.gameVersion === 'global'
		? key
		: false,
	)
	.filter(Boolean)

export const DEFAULT_LANGUAGE = 'en'
