import {action, observable} from 'mobx'
import {getUserLanguage} from 'utilities'

export class I18nStore {
	@observable siteLanguage: string = getUserLanguage()
	@observable siteSet: boolean = false
	@observable overlay: boolean = false

	@action
	setSiteLanguage(language: string) {
		this.siteLanguage = language
		this.siteSet = true
	}

	@action
	resetSiteLanguage() {
		this.siteLanguage = getUserLanguage()
		this.siteSet = false
	}

	@action
	toggleOverlay() {
		this.overlay = !this.overlay
	}
}

export const i18nStore = new I18nStore()
