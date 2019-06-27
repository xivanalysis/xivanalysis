import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'
import {Accordion} from 'semantic-ui-react'

import Rotation from 'components/ui/Rotation'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestLower} from 'utilities'

// BRD weaves, ninjustsu, etc. should be handled by subclasses w/ isBadWeave overrides
const DEFAULT_MAX_WEAVES = 2 // Default castTime is 0
const MAX_WEAVE_TIERS = {
	0: 2,
	1: 1,
	2.5: 0,
}

const WEAVING_SEVERITY = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export default class Weaving extends Module {
	static handle = 'weaving'
	static dependencies = [
		'castTime',
		'gcd',
		'invuln',
		'speedmod',
		'suggestions',
	]

	static title = t('core.weaving.title')`Weaving Issues`

	_weaves = []
	_ongoingCastEvent = null
	_leadingGcdEvent = null
	_trailingGcdEvent = null
	_badWeaves = []

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onBeginCast(event) {
		this._ongoingCastEvent = event
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)

		// If the action is an auto, just ignore it
		if (!action || action.autoAttack) {
			return
		}

		// If it's not a GCD, just bump the weave count
		if (this.isOgcd(action)) {
			this._weaves.push(event)
			return
		}

		if (this._ongoingCastEvent && this._ongoingCastEvent.ability.guid === action.id) {
			// This event is the end of a GCD cast
			this._trailingGcdEvent = {
				...event,
				// Override the timestamp of the GCD with when its cast began
				timestamp: this._ongoingCastEvent.timestamp,
			}
		} else {
			// This event was an instant GCD (or log missed the cast starting)
			this._trailingGcdEvent = event
		}

		// Always reset the ongoing cast
		this._ongoingCastEvent = null

		// Throw the current state onto the history
		this._saveIfBad()

		// Reset
		this._leadingGcdEvent = this._trailingGcdEvent
		this._weaves = []
	}

	_onComplete() {
		// If there's been at least one gcd, run a cleanup on any remnant data
		if (this._leadingGcdEvent) {
			this._saveIfBad()
		}

		// Few triples is medium, any more is major
		const badWeaves = this._badWeaves
		this.suggestions.add(new TieredSuggestion({
			// WVR Focused synth lmao
			icon: 'https://xivapi.com/i/001000/001785.png',
			content: <Trans id="core.weaving.content">
				Avoid weaving more actions than you have time for in a single GCD window. Doing so will delay your next GCD, reducing possible uptime. Check the <a href="javascript:void(0);" onClick={() => this.parser.scrollTo(this.constructor.handle)}><NormalisedMessage message={this.constructor.title}/></a> module below for more detailed analysis.
			</Trans>,
			why: <Plural
				id="core.weaving.why"
				value={badWeaves.length}
				_1="# instance of incorrect weaving"
				other="# instances of incorrect weaving"
			/>,
			tiers: WEAVING_SEVERITY,
			value: badWeaves.length,
		}))
	}

	_saveIfBad() {
		const leadingGcdEvent =	this._leadingGcdEvent || {timestamp: this.parser.fight.start_time}
		const gcdTimeDiff = this._trailingGcdEvent.timestamp -
			leadingGcdEvent.timestamp -
			this.invuln.getUntargetableUptime('all', 	leadingGcdEvent.timestamp, this._trailingGcdEvent.timestamp)

		const weave = {
			leadingGcdEvent,
			trailingGcdEvent: this._trailingGcdEvent,
			gcdTimeDiff,
			weaves: this._weaves,
		}

		if (weave.weaves.length === 0) {
			return
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
		// Calc. the no. of weaves - we're ignoring any made while the boss is untargetable
		const weaveCount = weave.weaves.filter(
			event => !this.invuln.isUntargetable('all', event.timestamp)
		).length

		// Just using maxWeaves to allow potential subclasses to utilise standard functionality with custom max
		if (!maxWeaves) {
			// If there's no leading ability, it's the first GCD. Allow the 'default' cast time's amount
			if (!weave.leadingGcdEvent.ability) {
				maxWeaves = DEFAULT_MAX_WEAVES
			} else {
				const castTime = this.castTime.forEvent(weave.leadingGcdEvent)
				const closest = matchClosestLower(MAX_WEAVE_TIERS, castTime)
				maxWeaves = closest !== undefined? closest : DEFAULT_MAX_WEAVES
			}
		}

		// It's possible that they did a bunch of weaves during downtime or similar - that's fine.
		const speedmod = this.speedmod.get(this.parser.timestamp)
		const gcdLength = this.gcd.getEstimate() * speedmod

		return weave.gcdTimeDiff > gcdLength && weaveCount > maxWeaves
	}

	output() {
		const badWeaves = this._badWeaves
		if (badWeaves.length === 0) {
			return false
		}

		const panels = badWeaves.map(item => ({
			key: item.leadingGcdEvent.timestamp,
			title: {
				content: <>
					<strong>{this.parser.formatTimestamp(item.leadingGcdEvent.timestamp)}</strong>
					&nbsp;-&nbsp;
					<Plural
						id="core.weaving.panel-count"
						value={item.weaves.length}
						_1="# weave"
						other="# weaves"
					/>
					&nbsp;(
					{this.parser.formatDuration(item.gcdTimeDiff)}
					&nbsp;
					<Trans id="core.weaving.between-gcds">between GCDs</Trans>
					)
				</>,
			},
			content: {
				content: <Rotation events={[
					...(item.leadingGcdEvent.ability? [item.leadingGcdEvent] : []),
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
