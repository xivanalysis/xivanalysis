import {action, observable} from 'mobx'

export class SettingsStore {
	@observable killsOnly: boolean = true
	@observable showMinorSuggestions: boolean = false
	@observable bypassCacheNextRequest: boolean = false

	@action
	setViewKillsOnly(value: boolean) {
		this.killsOnly = value
	}

	@action
	setShowMinorSuggestions(value: boolean) {
		this.showMinorSuggestions = value
	}

	@action
	setBypassCacheNextRequest(value: boolean) {
		this.bypassCacheNextRequest = value
	}
}

export const settingsStore = new SettingsStore()
