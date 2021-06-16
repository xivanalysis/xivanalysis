import {StrictDropdownItemProps} from 'semantic-ui-react'
import themeStyles from 'theme/theme.module.css'

export const THEMEDEBUG = true && process.env.NODE_ENV !== 'production'

export interface ThemeData {
	enable: boolean,
	menu: StrictDropdownItemProps
	className: string,
}

export enum Theme {
	LIGHT = 'LIGHT',
	DARK = 'DARK'
}

export const THEMES: Record<Theme, ThemeData> = {
	[Theme.LIGHT]: {
		menu: {
			text: 'Light',
			icon: 'sun',
		},
		enable: true,
		className: '',
	},
	[Theme.DARK]: {
		menu: {
			text: 'Dark',
			icon: 'moon',
		},
		enable: true,
		className: themeStyles.darkMode,
	},
}

export const DEFAULT_THEME = Theme.LIGHT
