import {t} from '@lingui/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import {DISPLAY_ORDER} from '../DISPLAY_ORDER'
import {Suggestions as SuggestionsComponent} from './Component'
import {Suggestion} from './Suggestion'

export class Suggestions extends Analyser {
	static override handle = 'suggestions'
	static override displayOrder = DISPLAY_ORDER.SUGGESTIONS
	static override displayMode = DisplayMode.FULL
	static override title = t('core.suggestions.title')`Suggestions`

	_suggestions: Suggestion[] = []

	add(suggestion: Suggestion) {
		if (!(suggestion instanceof Suggestion)) {
			console.error('TODO: Proper error message for passing a non-suggestion to the suggestion add handler')
			return
		}

		this._suggestions.push(suggestion)
	}

	override output() {
		// Only show the suggestions module if it's had things sent to it
		if (this._suggestions.length === 0) {
			return false
		}

		// Rendering is in a specialised component so it's got some state to work with
		return <SuggestionsComponent suggestions={this._suggestions}/>
	}
}
