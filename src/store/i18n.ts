import {GameEdition} from 'data/EDITIONS'
import {Language, LANGUAGES} from 'data/LANGUAGES'
import {action, observable} from 'mobx'
import {getUserLanguage} from 'utilities'

export const gameLanguageEditions: GameEdition[] = [
	GameEdition.GLOBAL,
	// GameEdition.CHINESE, // Cafemaker
]

function getGameLanguage(language: Language): Language {
	// Check if the language is a game language, fall back to EN
	if (gameLanguageEditions.includes(LANGUAGES[language].gameEdition)) {
		return language
	}
	return Language.ENGLISH
}

export class I18nStore {
	@observable siteLanguage: Language = getUserLanguage()
	@observable siteSet: boolean = false
	@observable gameLanguage: Language = getGameLanguage(this.siteLanguage)
	@observable gameSet: boolean = false
	@observable overlay: boolean = false

	@action
	setSiteLanguage(language: Language) {
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
	setGameLanguage(language: Language) {
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
