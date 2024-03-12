import {action, observable} from 'mobx'

export class ThemeStore {
	@observable darkMode: boolean = false

	@action
	setDarkMode(value: boolean) {
		this.darkMode = value
	}
}

export const themeStore = new ThemeStore()
