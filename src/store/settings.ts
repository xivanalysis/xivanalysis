import {action, observable} from 'mobx'

export class SettingsStore {
	@observable killsOnly: boolean = true
	@observable showMinorSuggestions: boolean = false

	@action
	setViewKillsOnly(value: boolean) {
		this.killsOnly = value
	}

	@action
	setShowMinorSuggestions(value: boolean) {
		this.showMinorSuggestions = value
	}
}

export const settingsStore = new SettingsStore()
