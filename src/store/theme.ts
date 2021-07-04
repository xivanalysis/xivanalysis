import {DEFAULT_THEME, Theme} from 'data/THEMES'
import {action, observable} from 'mobx'

export class ThemeStore {
	@observable currentTheme: Theme = DEFAULT_THEME

	@action
	setCurrentTheme(value: Theme) {
		this.currentTheme = value
	}
}

export const themeStore = new ThemeStore()
