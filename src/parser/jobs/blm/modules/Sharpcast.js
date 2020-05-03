import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import React from 'react'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans, Plural} from '@lingui/react'
import {StatusLink, ActionLink} from 'components/ui/DbLink'
import {StatusItem} from 'parser/core/modules/Timeline'
import {SimpleStatistic} from 'parser/core/modules/Statistics'

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
		'procs',
		'suggestions',
		'cooldownDowntime',
		'statistics',
	]

	_buffWindows = {
		current: null,
		history: [],
	}

	_droppedSharpcasts = 0
	_sharpedScathes = 0
	_usedSharpcasts = 0

	constructor(...args) {
		super(...args)
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.SHARPCAST.id}, this._onRemoveSharpcast)
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.SHARPCAST.id}, this._onGainSharpcast)
		this.addEventHook('cast', {by: 'player', abilityId: SHARPCAST_CONSUMER_IDS}, this._onCast)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	_onRemoveSharpcast(event) {
		this._stopAndSave(event.timestamp)
	}

	_onGainSharpcast(event) {
		this._usedSharpcasts++
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

		const row = this.procs.getRowForStatus(STATUSES.SHARPCAST)

		const fightStart = this.parser.fight.start_time

		// Add buff windows to the timeline
		this._buffWindows.history.forEach(window => {
			row.addItem(new StatusItem({
				status: STATUSES.SHARPCAST,
				start: window.start - fightStart,
				end: window.stop - fightStart,
			}))
		})

		// Gather the data for actual / expected
		const expected = this.cooldownDowntime.calculateMaxUsages({cooldowns: [ACTIONS.SHARPCAST]})
		const actual = this._usedSharpcasts
		let percent = actual / expected * 100
		if (process.env.NODE_ENV === 'production') {
			percent = Math.min(percent, 100)
		}

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

		//add a statistic for used sharps
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="blm.sharpcast.statistic.title">Used Sharpcasts</Trans>,
			icon: ACTIONS.SHARPCAST.icon,
			value: `${actual}/${expected} (${percent.toFixed(1)}%)`,
			info: (
				<Trans id="blm.sharpcast.statistic.info">
					The number of Sharpcasts used versus the number of possible Sharpcast uses. Less than 100% is generally expected, but especially low usage could indicate misuse of the cooldown.
				</Trans>
			),
		}))
	}
}
