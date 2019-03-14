import {StrictDropdownItemProps} from 'semantic-ui-react'
import {stringBefore} from 'utilities'
import {GameEdition} from './PATCHES'

interface LanguageData {
	enable: boolean
	gameEdition: GameEdition
	menu: StrictDropdownItemProps
}

export enum Language {
	ENGLISH = 'en',
	JAPANESE = 'ja',
	FRENCH = 'fr',
	GERMAN = 'de',
	KOREAN = 'ko',
	CHINESE = 'zh',
}

export const LANGUAGES: Record<Language, LanguageData> = {
	[Language.ENGLISH]: {
		menu: {
			text: 'English',
			flag: 'gb',
		},
		enable: true,
		gameEdition: GameEdition.GLOBAL,
	},
	[Language.JAPANESE]: {
		menu: {
			text: '日本語',
			flag: 'jp',
		},
		enable: true,
		gameEdition: GameEdition.GLOBAL,
	},
	[Language.FRENCH]: {
		menu: {
			text: 'Français',
			flag: 'fr',
		},
		enable: true,
		gameEdition: GameEdition.GLOBAL,
	},
	[Language.GERMAN]: {
		menu: {
			text: 'Deutsch',
			flag: 'de',
		},
		enable: true,
		gameEdition: GameEdition.GLOBAL,
	},
	[Language.KOREAN]: {
		menu: {
			text: '한국어',
			flag: 'kr',
		},
		enable: true,
		gameEdition: GameEdition.KOREAN,
	},
	[Language.CHINESE]: {
		menu: {
			text: '简体中文',
			flag: 'cn',
		},
		enable: true,
		gameEdition: GameEdition.CHINESE,
	},
}

export const SHORT_LANGUAGE_MAP = Object.keys(LANGUAGES).reduce(
	(carry, key) => {
		carry[stringBefore(key, '-')] = key as Language
		return carry
	},
	{} as Record<string, Language>,
)

export const DEFAULT_LANGUAGE = Language.ENGLISH
