import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const DEBUFF_APPLICATION_BUFFER = 1000 // Buffer for the empty window check, since debuff applications always happen 9 times in the logs for some ungodly reason

const WILDFIRE_GCD_TARGET = 6
const WILDFIRE_GCD_WARNING = 5
const WILDFIRE_GCD_ERROR = 0

export default class Wildfire extends Module {
	static handle = 'wildfire'
	static title = t('mch.wildfire.title')`Wildfire`
	static dependencies = [
		'brokenLog',
		'enemies',
		'suggestions',
	]

	_wildfireWindows = {
		current: null,
		history: [],
	}

	constructor(...args) {
		super(...args)
		this.addEventHook('damage', {by: 'player'}, this._onDamage)
		this.addEventHook('damage', {by: 'player', abilityId: STATUSES.WILDFIRE.id}, this._onWildfireDamage)
		this.addEventHook('applydebuff', {by: 'player', abilityId: STATUSES.WILDFIRE.id}, this._onWildfireApplied)
		this.addEventHook('complete', this._onComplete)
	}

	_onDamage(event) {
		const target = this.enemies.getEntity(event.targetID)
		if (target && target.hasStatus(STATUSES.WILDFIRE.id) && // Target has WF on them
			this._wildfireWindows.current !== null && // And we're in a WF window (in case there are multiple MCHs)
			this._wildfireWindows.current.targetId === event.targetID) { // And we're hitting the WF-afflicted target
			this._wildfireWindows.current.casts.push({...event})
		}
	}

	_closeWildfireWindow(damage) {
		this._wildfireWindows.current.gcdCount = this._wildfireWindows.current.casts.filter(cast => {
			const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
			return action && action.onGcd
		}).length
		this._wildfireWindows.current.damage = damage
		this._wildfireWindows.history.push(this._wildfireWindows.current)
		this._wildfireWindows.current = null

	}

	_onWildfireDamage(event) {
		if (this._wildfireWindows.current !== null) {
			this._closeWildfireWindow(event.amount)
		} else {
			// Something fucky this way comes - we got a WF damage event without a corresponding applydebuff, which means the log is probably jank.
			// Create a fake window so we still display time/damage and notify the "broken log" module.
			this.brokenLog.trigger(this, 'no buff wf', (
				<Trans id="mch.wildfire.trigger.no-buff-wf">
					<ActionLink {...ACTIONS.WILDFIRE}/> damage was recorded without a corresponding <StatusLink {...STATUSES.WILDFIRE}/> debuff.
				</Trans>
			))
			this._wildfireWindows.history.push({
				spoofed: true,
				start: event.timestamp - (STATUSES.WILDFIRE.duration * 1000),
				damage: event.amount,
			})
		}
	}

	_onWildfireApplied(event) {
		if (this._wildfireWindows.current && this._wildfireWindows.current.start + DEBUFF_APPLICATION_BUFFER < event.timestamp) {
			// We have an unfinished WF window; the lack of a damage event to close it implies that it fizzled due to downtime, so track that
			this._closeWildfireWindow(0)
		}

		this._wildfireWindows.current = {
			start: event.timestamp,
			casts: [],
			targetId: event.targetID,
		}
	}

	_onComplete() {
		const badWildfires = this._wildfireWindows.history.filter(wildfire => wildfire.gcdCount < WILDFIRE_GCD_TARGET).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.WILDFIRE.icon,
			content: <Trans id="mch.wildfire.suggestions.cooldown.content">
				Try to ensure you have an Overheat window prepared for every <ActionLink {...ACTIONS.WILDFIRE}/> cast to maximize damage. Each GCD in a Wildfire window is worth 200 potency, so maximizing the GCD count with <ActionLink {...ACTIONS.HEAT_BLAST}/> is important.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: badWildfires,
			why: <Trans id="mch.wildfire.suggestions.cooldown.why">
				{badWildfires} of your Wildfire windows contained fewer than {WILDFIRE_GCD_TARGET} GCDs.
			</Trans>,
		}))

		const fizzledWildfires = this._wildfireWindows.history.filter(wildfire => wildfire.damage === 0).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.WILDFIRE.icon,
			content: <Trans id="mch.wildfire.suggestions.fizzle.content">
				Be careful to time your <ActionLink {...ACTIONS.WILDFIRE}/> windows so that the damage resolves during uptime, or detonate them early if necessary to at least get partial potency.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: fizzledWildfires,
			why: <Trans id="mch.wildfire.suggestions.fizzle.why">
				{fizzledWildfires} of your Wildfire windows resolved for 0 damage.
			</Trans>,
		}))

	}

	_formatGcdCount(count) {
		if (count === WILDFIRE_GCD_ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count <= WILDFIRE_GCD_WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return count
	}

	_formatDamage(damage) {
		if (damage === 0) {
			return <span className="text-error">{damage}</span>
		}

		return damage
	}

	output() {
		const panels = this._wildfireWindows.history.map(wildfire => {
			if (wildfire.spoofed) {
				return {
					title: {
						key: 'title-' + wildfire.start,
						content: <Fragment>
							{this.parser.formatTimestamp(wildfire.start)}
							<span> - </span>
							<Trans id="mch.wildfire.panel-count-spoofed">
								? GCDs, {wildfire.damage} damage
							</Trans>
						</Fragment>,
					},
					content: {
						key: 'content-' + wildfire.start,
						content: <img src="https://xivapi.com/i/064000/064033.png"/>,
					},
				}
			}

			return {
				title: {
					key: 'title-' + wildfire.start,
					content: <Fragment>
						{this.parser.formatTimestamp(wildfire.start)}
						<span> - </span>
						<Trans id="mch.wildfire.panel-count">
							{this._formatGcdCount(wildfire.gcdCount)} <Plural value={wildfire.gcdCount} one="GCD" other="GCDs"/>, {this._formatDamage(wildfire.damage)} damage
						</Trans>
					</Fragment>,
				},
				content: {
					key: 'content-' + wildfire.start,
					content: <Rotation events={wildfire.casts}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.wildfire.accordion.message">Every <ActionLink {...ACTIONS.WILDFIRE}/> window should ideally contain at least {WILDFIRE_GCD_TARGET} GCDs to maximize its potency. Each Wildfire window below indicates how many GCDs it contained and the total damage it hit for, and will display all the damaging casts in the window if expanded.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}
}
