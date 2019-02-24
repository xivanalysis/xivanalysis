import {GAME_LANGUAGES} from 'data/LANGUAGES'
import {action, observable} from 'mobx'
import {getUserLanguage} from 'utilities'

function getGameLanguage(language: string): string {
	// Check if the language is a game language, fall back to EN
	if (GAME_LANGUAGES.includes(language)) {
		return language
	}
	return 'en'
}

export class I18nStore {
	@observable siteLanguage: string = getUserLanguage()
	@observable siteSet: boolean = false
	@observable gameLanguage: string = getGameLanguage(this.siteLanguage)
	@observable gameSet: boolean = false
	@observable overlay: boolean = false

	@action
	setSiteLanguage(language: string) {
		this.siteLanguage = language
		this.siteSet = true

		// Track if they've manually resynced it
		if (this.gameLanguage === this.siteLanguage) {
			this.gameSet = false
		}

		// If the game language hasn't been manually set, try to keep in sync
		if (!this.gameSet) {
			this.gameLanguage = getGameLanguage(language)
		}
	}

	@action
	resetSiteLanguage() {
		this.siteLanguage = getUserLanguage()
		this.siteSet = false
	}

	@action
	setGameLanguage(language: string) {
		this.gameLanguage = language

		// If they've split the langs, track it
		this.gameSet = this.gameLanguage !== this.siteLanguage
	}

	@action
	toggleOverlay() {
		this.overlay = !this.overlay
	}
}

export const i18nStore = new I18nStore()
