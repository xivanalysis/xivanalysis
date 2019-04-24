import {t} from '@lingui/macro'
import {DisplayOrder} from 'analyser/core/DisplayOrder'
import {DisplayMode, Module} from 'analyser/Module'
import React from 'react'
import {SuggestionsComponent} from './Component'
import {Suggestion} from './Suggestion'

export class Suggestions extends Module {
	static handle = 'suggestions'
	static title = t('core.suggestions.title')`Suggestions`
	static displayOrder = DisplayOrder.SUGGESTIONS
	static displayMode = DisplayMode.FULL

	private suggestions: Suggestion[] = []

	add(suggestion: Suggestion) {
		this.suggestions.push(suggestion)
	}

	output() {
		// Only show the suggestions module if it's had things sent to it
		if (this.suggestions.length === 0) {
			return null
		}

		// Rendering is in a specialised component so it's got some state to work with
		return <SuggestionsComponent suggestions={this.suggestions}/>
	}
}
