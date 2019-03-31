import {t} from '@lingui/macro'
import React from 'react'

import Suggestion, {SEVERITY} from './Suggestion'
import SuggestionsComponent from './Component'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

export default class Suggestions extends Module {
	static handle = 'suggestions'
	static displayOrder = DISPLAY_ORDER.SUGGESTIONS
	static displayMode = DISPLAY_MODE.FULL
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
