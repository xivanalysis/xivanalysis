import {GameEdition} from 'data/EDITIONS'
import {Language, LANGUAGES} from 'data/LANGUAGES'
import {action, computed, observable} from 'mobx'
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
	@observable gameSet: boolean = false
	@observable overlay: boolean = false

	/**
	 * Get the raw game language as defined by the user or derived from site-wide language.
	 *
	 * @deprecated **DO NOT USE DIRECTLY:** this property exists for compatibility with
	 * localstorage user configuration. Use `safeGameLanguage` instead.
	 */
	@observable gameLanguage: Language = getGameLanguage(this.siteLanguage)

	/**
	 * Get the user-specified game language if valid, falling back to English if
	 * the game language targets an unsupported game edition.
	 *
	 * This is an unfortunate side effect of the old mobx+localstorage persistence
	 * setup, and is a bandaid at best.
	 */
	@computed get safeGameLanguage() {
		return getGameLanguage(this.gameLanguage)
	}

	@action
	setSiteLanguage(language: Language) {
		this.siteLanguage = language

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
