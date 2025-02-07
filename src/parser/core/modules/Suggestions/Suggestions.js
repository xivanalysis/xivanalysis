import {t} from '@lingui/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import SuggestionsComponent from './Component'
import Suggestion, {SEVERITY} from './Suggestion'

export default class Suggestions extends Analyser {
	static handle = 'suggestions'
	static displayOrder = DISPLAY_ORDER.SUGGESTIONS
	static displayMode = DisplayMode.FULL
	static title = t('core.suggestions.title')`Suggestions`

	_suggestions = []

	add(suggestion) {
		if (!(suggestion instanceof Suggestion)) {
			console.error('TODO: Proper error message for passing a non-suggestion to the suggestion add handler')
			return
		}

		this._suggestions.push(suggestion)
	}

	output() {
		// Only show the suggestions module if it's had things sent to it
		if (this._suggestions.length === 0) {
			return false
		}

		// Sort suggestions with most important at the top, and remove ignored
		const suggestions = this._suggestions
			.filter(suggestion => suggestion.severity !== SEVERITY.IGNORE)
			.sort((a, b) => a.severity - b.severity)

		// Rendering is in a specialised component so it's got some state to work with
		return <SuggestionsComponent suggestions={suggestions}/>
	}
}
