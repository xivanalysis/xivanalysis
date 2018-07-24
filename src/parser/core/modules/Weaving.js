import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import Rotation from 'components/ui/Rotation'
import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// BRD weaves, ninjustsu, etc. should be handled by subclasses w/ isBadWeave overrides
const MAX_WEAVES = {
	[undefined]: 2, // Default castTime is 0
	0: 2,
	1: 1,
	1.5: 1,
	2: 1,
	2.5: 0,
	default: 0,
}
const MAJOR_SUGGESTION_ISSUES = 5

export default class Weaving extends Module {
	static handle = 'weaving'
	static dependencies = [
		'castTime',
		'invuln',
		'suggestions',
	]
	static title = 'Weaving Issues'

	_weaves = []
	_gcdEvent = null
	_badWeaves = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)

		// If the action is an auto, just ignore it
		if (action.autoAttack) {
			return
		}

		// If it's not a GCD, just bump the weave count
		if (this.isOgcd(action)) {
			this._weaves.push(event)
			return
		}

		// If there's no gcd event, they're weaving on first GCD.
		// TODO: Do I care?
		if (this._gcdEvent === null && this._weaves.length > 0) {
			console.warn(this._weaves, 'weaves before first GCD. Check.')
		}

		// Throw the current state onto the history
		this._saveIfBad()

		// Reset
		this._gcdEvent = event
		this._weaves = []
	}

	_onComplete() {
		// If there's been at least one gcd, run a cleanup on any remnant data
		if (this._gcdEvent) {
			this._saveIfBad()
		}

		// Few triples is medium, any more is major
		const badWeaves = this._badWeaves
		if (badWeaves.length) {
			this.suggestions.add(new Suggestion({
				icon: 'https://secure.xivdb.com/img/game/001000/001785.png', // WVR Focused synth lmao
				content: <Fragment>
					Avoid weaving more actions than you have time for in a single GCD window. Doing so will delay your next GCD, reducing possible uptime. Check the <em>{this.name}</em> module below for more detailed analysis.
				</Fragment>,
				severity: badWeaves.length > MAJOR_SUGGESTION_ISSUES? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: `${badWeaves.length} instances of incorrect weaving.`,
			}))
		}
	}

	_saveIfBad() {
		const weave = {
			gcdEvent: this._gcdEvent || {
				timestamp: this.parser.fight.start_time,
			},
			weaves: this._weaves,
		}
		if (this.isBadWeave(weave)) {
			this._badWeaves.push(weave)
		}
	}

	isOgcd(action) {
		return !action.onGcd
			&& !action.autoAttack
	}

	// Basic weave check. For job-specific weave concerns, subclass Weaving and override this method. Make sure it's included under the same module key to override the base implementation.
	isBadWeave(weave, maxWeaves) {
		// The first weave won't have an ability (faked event)
		// They... really shouldn't be weaving before the first GCD... I think
		// TODO: ^?
		if (!weave.gcdEvent.ability) {
			return weave.weaves.length
		}

		// Just using maxWeaves to allow potential subclasses to utilise standard functionality with custom max
		if (!maxWeaves) {
			const castTime = this.castTime.forEvent(weave.gcdEvent)
			maxWeaves = MAX_WEAVES[castTime] || MAX_WEAVES.default
		}

		// Calc. the no. of weaves - we're ignoring any made while the boss is untargetable
		const weaveCount = weave.weaves.filter(
			event => !this.invuln.isUntargetable('all', event.timestamp)
		).length

		return weaveCount > maxWeaves
	}

	output() {
		const badWeaves = this._badWeaves
		if (badWeaves.length === 0) {
			return false
		}

		const panels = badWeaves.map(item => ({
			key: item.gcdEvent.timestamp,
			title: {
				content: <Fragment>
					<strong>{this.parser.formatTimestamp(item.gcdEvent.timestamp)}</strong>
					&nbsp;-&nbsp;{item.weaves.length} weaves
				</Fragment>,
			},
			content: {
				content: <Rotation events={[
					...(item.gcdEvent.ability? [item.gcdEvent] : []),
					...item.weaves,
				]}/>,
			},
		}))

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
