import {action, observable} from 'mobx'
import {getUserLanguage} from 'utilities'

export class I18nStore {
	@observable language: string = getUserLanguage()
	@observable siteSet: boolean = false
	@observable overlay: boolean = false

	@action
	setLanguage(language: string) {
		this.language = language
		this.siteSet = true
	}

	@action
	updateLanguage() {
		this.language = getUserLanguage()
	}

	@action
	toggleOverlay() {
		this.overlay = !this.overlay
	}
}

export const i18nStore = new I18nStore()
