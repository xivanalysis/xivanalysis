import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import React from 'react'
import {Item} from 'parser/core/modules/Timeline'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans, Plural} from '@lingui/react'
import {StatusLink, ActionLink} from 'components/ui/DbLink'

const SHARPCAST_DURATION_MILLIS = STATUSES.SHARPCAST.duration * 1000

const SHARPCAST_CONSUMER_IDS = [
	ACTIONS.FIRE_I.id,
	ACTIONS.THUNDER_III.id,
	ACTIONS.THUNDER_IV.id,
	ACTIONS.SCATHE.id,
]

export default class Sharpcast extends Module {
	static handle = 'sharpcast'
	static dependencies = [
		'timeline',
		'procs',
		'suggestions',
	]

	_buffWindows = {
		current: null,
		history: [],
	}

	_droppedSharpcasts = 0
	_sharpedScathes = 0

	constructor(...args) {
		super(...args)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.SHARPCAST.id}, this._onRemoveSharpcast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.SHARPCAST.id}, this._onGainSharpcast)
		this.addHook('cast', {by: 'player', abilityId: SHARPCAST_CONSUMER_IDS}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onRemoveSharpcast(event) {
		this._stopAndSave(event.timestamp)
	}

	_onGainSharpcast(event) {
		this._buffWindows.current = {
			start: event.timestamp,
		}
	}

	// Consolidate old onCast functions into one central function
	_onCast(event) {
		const actionId = event.ability.guid

		const action = getDataBy(ACTIONS, 'id', actionId)
		if (action && action.onGcd) {
			this._tryConsumeSharpcast(event)
		}
	}

	_tryConsumeSharpcast(event) {
		const actionId = event.ability.guid

		// If this action isn't affected by a proc (or something is wrong), bail out
		if (!SHARPCAST_CONSUMER_IDS.includes(actionId)) {
			return
		}

		// If this proc is active, consume it
		if (this._buffWindows.current) {
			// Stop the buff window, and ensure it's not marked as a drop
			this._stopAndSave(event.timestamp, false)

			if (actionId === ACTIONS.SCATHE.id) {
				this._sharpedScathes++
			}
		}
	}

	_onDeath(event) {
		this._stopAndSave(event.timestamp)
	}

	_stopAndSave(endTime = this.parser.currentTimestamp, countDrops = true) {
		if (!this._buffWindows.current) {
			return
		}

		this._buffWindows.current.stop = endTime
		if (this._buffWindows.current.stop - this._buffWindows.current.start >= SHARPCAST_DURATION_MILLIS && countDrops) {
			this._droppedSharpcasts++
		}
		this._buffWindows.history.push(this._buffWindows.current)
		this._buffWindows.current = null
	}

	_onComplete() {
		// Finalise the buff if it was still active
		if (this._buffWindows.current) {
			this._stopAndSave()
		}

		const groupId = this.procs.getGroupIdForStatus(STATUSES.SHARPCAST)
		const fightStart = this.parser.fight.start_time

		// Add buff windows to the timeline
		this._buffWindows.history.forEach(window => {
			this.timeline.addItem(new Item({
				type: 'background',
				start: window.start - fightStart,
				end: window.stop - fightStart,
				group: groupId,
				content: <img src={STATUSES.SHARPCAST.icon} alt={STATUSES.SHARPCAST.name}/>,
			}))
		})

		// Suggestions to use sharpcasts that wore off.
		this.suggestions.add(new TieredSuggestion({
			icon: STATUSES.SHARPCAST.icon,
			content: <Trans id="blm.sharpcast.suggestions.dropped-sharpcasts.content">
				You lost at least one guaranteed <StatusLink {...STATUSES.THUNDERCLOUD}/> or <StatusLink {...STATUSES.FIRESTARTER}/> proc by allowing <StatusLink {...STATUSES.SHARPCAST}/> to fall off.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._droppedSharpcasts,
			why: <Trans id="blm.sharpcast.suggestions.dropped-sharpcasts.why">
				<Plural value={this._droppedSharpcasts} one="# Sharpcast" other="# Sharpcasts"/> expired.
			</Trans>,
		}))

		// Suggestion not to overuse sharp-scathe
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SCATHE.icon,
			content: <Trans id="blm.sharpcast.suggestions.sharpcasted-scathes.content">
				You consumed at least one <StatusLink {...STATUSES.SHARPCAST} /> by using <ActionLink {...ACTIONS.SCATHE} />. While it's better than letting the buff expire, you should try to avoid doing so.
			</Trans>,
			tiers: { // Giving one extra usage before we start dinging med/major since there's kind of a reasonable use-case
				1: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			value: this._sharpedScathes,
			why: <Trans id="blm.sharpcast.suggestions.sharpcasted-scathes.why">
				<Plural value={this._sharpedScathes} one="# Sharpcast was" other="# Sharpcasts were"/> consumed by <ActionLink {...ACTIONS.SCATHE} />.
			</Trans>,
		}))
	}
}
