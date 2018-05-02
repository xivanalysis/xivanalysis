import React from 'react'

import SuggestionsComponent from 'components/modules/Suggestions'
import ACTIONS from 'data/ACTIONS'
import Module, { DISPLAY_ORDER } from 'parser/core/Module'
import Suggestion, { SEVERITY } from './Suggestion'

export default class Suggestions extends Module {
	static displayOrder = DISPLAY_ORDER.SUGGESTIONS

	suggestions = [
		new Suggestion({
			icon: ACTIONS.RUIN_III.icon,
			content: 'Test with lots of text because the suggestions look really shit with short descriptions maybe I should do something about that but then again that\'d mean another css module to write and quite frankly I don\'t think I can be assed right now',
			why: 'You did something really wrong',
			severity: SEVERITY.MAJOR
		}),
		new Suggestion({
			icon: ACTIONS.RUIN_III.icon,
			content: 'Test with lots of text because the suggestions look really shit with short descriptions maybe I should do something about that but then again that\'d mean another css module to write and quite frankly I don\'t think I can be assed right now',
			why: 'I\'m nitpicking',
			severity: SEVERITY.MINOR
		}),
		new Suggestion({
			icon: ACTIONS.RUIN_III.icon,
			content: 'Test with lots of text because the suggestions look really shit with short descriptions maybe I should do something about that but then again that\'d mean another css module to write and quite frankly I don\'t think I can be assed right now',
			why: 'Probably could improve this',
			severity: SEVERITY.MEDIUM
		})
	]

	showMinor = false

	output() {
		// Rendering is in a specialised component so it's got some state to work with
		return <SuggestionsComponent suggestions={this.suggestions}/>
	}
}
