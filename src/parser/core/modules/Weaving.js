import React, { Fragment } from 'react'
import { Accordion } from 'semantic-ui-react'

import { getAction } from 'data/ACTIONS'
import Module from 'parser/core/Module'
import { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'

// TODO: This doesn't account for Ninjutsu, or BRD weaves. Work it out later.
const MAX_WEAVES = 2
const MAJOR_SUGGESTION_WEAVES = 4
const MAJOR_SUGGESTION_ISSUES = 5

export default class Weaving extends Module {
	static dependencies = [
		'invuln',
		'suggestions'
	]
	name = 'Weaving Issues'

	weaves = []
	gcdEvent = null
	history = []

	on_cast_byPlayer(event) {
		const action = getAction(event.ability.guid)

		// If it's not a GCD, just bump the weave count
		if (this.isOgcd(action) && !this.invuln.isUntargetable()) {
			this.weaves.push(event)
			return
		}

		// If there's no gcd event, they're weaving on first GCD.
		// TODO: Do I care?
		if (this.gcdEvent === null && this.weaves.length > 0) {
			console.warn(this.weaves, 'weaves before first GCD. Check.')
		}

		// Throw the current state onto the history
		this.history.push({
			gcdEvent: this.gcdEvent || {
				timestamp: this.parser.fight.start_time
			},
			weaves: this.weaves
		})

		// Reset
		this.gcdEvent = event
		this.weaves = []
	}

	on_complete() {
		// Few triples is medium, quad+ or lots of triples is major
		const badWeaves = this.badWeaves
		if (badWeaves.length) {
			const major = badWeaves.some(
				item => item.weaves.length >= MAJOR_SUGGESTION_WEAVES
			) || badWeaves.length > MAJOR_SUGGESTION_ISSUES
			this.suggestions.add(new Suggestion({
				icon: 'https://secure.xivdb.com/img/game/001000/001785.png', // WVR Focused synth lmao
				content: <Fragment>
					Weaving more than {MAX_WEAVES} actions in a single GCD window will cause you to clip into your next GCD, losing uptime. Check the <em>{this.name}</em> module below for more detailed analysis.
				</Fragment>,
				severity: major? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: `${badWeaves.length} instances of >${MAX_WEAVES} oGCDs weaved.`
			}))
		}
	}

	isOgcd(action) {
		return !action.onGcd
			&& !action.autoAttack
	}

	get badWeaves() {
		return this.history.filter(item => item.weaves.length > MAX_WEAVES)
	}

	output() {
		const badWeaves = this.badWeaves
		if (badWeaves.length === 0) {
			return false
		}

		const panels = this.badWeaves.map(item => ({
			title: {
				key: 'title-' + item.gcdEvent.timestamp,
				content: <Fragment>
					<strong>{this.parser.formatTimestamp(item.gcdEvent.timestamp)}</strong>
					&nbsp;({item.weaves.length} weaves)
				</Fragment>
			},
			content: {
				key: 'content-' + item.gcdEvent.timestamp,
				content: <ul>
					{item.weaves.map(weave => <li key={weave.timestamp}>
						{weave.ability.name}
					</li>)}
				</ul>
			}
		}))

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
