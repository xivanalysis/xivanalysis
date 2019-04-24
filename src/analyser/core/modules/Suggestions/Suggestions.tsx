import {t} from '@lingui/macro'
import {DisplayOrder} from 'analyser/core/DisplayOrder'
import {DisplayMode, Module} from 'analyser/Module'
import {SuggestionsComponent} from './Component'
import {Suggestion} from './Suggestion'

export class Suggestions extends Module {
	static handle = 'suggestions'
	static title = t('core.suggestions.title')`Suggestions`
	static displayOrder = DisplayOrder.SUGGESTIONS
	static displayMode = DisplayMode.FULL

	private suggestions: Suggestion[] = []

	addEventListener(suggestion: Suggestion) {
		this.suggestions.push(suggestion)
	}

	output() {
		// Only show the suggestions module if it's had things sent to it
		if (this.suggestions.length === 0) {
			return null
		}

		// Sort suggestions with most important at the top, and remove ignored
		const suggestions = this.suggestions
			.filter(suggestion => suggestion.severity !== undefined)
			.sort((a, b) => a.severity! - b.severity!)

		// Rendering is in a specialised component so it's got some state to work with
		return <SuggestionsComponent suggestions={suggestions}/>
	}
}
