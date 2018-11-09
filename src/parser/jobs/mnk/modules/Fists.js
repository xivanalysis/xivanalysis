import Color from 'color'
import React, {Fragment} from 'react'
import PieChartWithLegend from 'components/ui/PieChartWithLegend'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES, {getStatus} from 'data/STATUSES'

import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const STANCELESS = 0

const STANCES = [
	STATUSES.FISTS_OF_EARTH.id,
	STATUSES.FISTS_OF_FIRE.id,
	STATUSES.FISTS_OF_WIND.id,
]

// Stance mapping for event splicing
// We don't need Riddle of Wind because a tackle triggers it
const STANCE_MAP = {
	[ACTIONS.EARTH_TACKLE.id]: STATUSES.FISTS_OF_EARTH.id,
	[ACTIONS.FIRE_TACKLE.id]: STATUSES.FISTS_OF_FIRE.id,
	[ACTIONS.WIND_TACKLE.id]: STATUSES.FISTS_OF_WIND.id,
	[ACTIONS.RIDDLE_OF_EARTH.id]: STATUSES.FISTS_OF_EARTH.id,
	[ACTIONS.RIDDLE_OF_FIRE.id]: STATUSES.FISTS_OF_FIRE.id,
}

const CHART_COLOURS = {
	[STANCELESS]: '#888',
	[STATUSES.FISTS_OF_EARTH.id]: Color(JOBS.MONK.colour),   // idk it matches
	[STATUSES.FISTS_OF_FIRE.id]: Color(JOBS.WARRIOR.colour), // POWER
	[STATUSES.FISTS_OF_WIND.id]: Color(JOBS.PALADIN.colour), // only good for utility
}

const STANCELESS_SEVERITY = {
	1: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

// Medium on a full combo, major on 2 since they should be GL3 by now
const WIND_SEVERITY = {
	3: SEVERITY.MEDIUM,
	6: SEVERITY.MAJOR,
}

// Forced disengaging is rarely more than 2 GCDs
const EARTH_SEVERITY = {
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export default class Fists extends Module {
	static handle = 'fists'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	static title = 'Fist Stances'
	static displayOrder = DISPLAY_ORDER.FISTS

	// Assume stanceless by default
	//  if there's a pre-start applybuff, it'll get corrected, and if not, it's already correct
	_activeFist = STANCELESS
	_fistUptime = {}
	_fistGCDs = {}

	_lastFistChange = this.parser.fight.start_time

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {to: 'player', abilityId: STANCES}, this._onGain)
		this.addHook('removebuff', {to: 'player', abilityId: STANCES}, this._onRemove)
		this.addHook('complete', this._onComplete)
	}

	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const abilityId = event.ability.guid

			// Ignore any non-ability events
			if (!abilityId) {
				continue
			}

			// We got a remove (PrecastStatus will handle this), or an initial apply
			if (['removebuff', 'applybuff'].includes(event.type) && STANCES.includes(abilityId)) {
				break
			}

			// Check for any specific casts that imply stance
			if (event.type === 'cast') {
				// They dun goofed
				if (abilityId === ACTIONS.SHOULDER_TACKLE.id) {
					break
				}

				// It was a legit Tackle, we know what's up
				if (Object.keys(STANCE_MAP).map(Number).includes(abilityId)) {
					events.splice(0, 0, {
						...event,
						ability: {
							guid: STANCE_MAP[abilityId],
						},
						timestamp: this.parser.fight.start_time - 1,
						type: 'applybuff',
					})

					break
				}
			}
		}

		return events
	}

	_handleFistChange(stanceId) {
		// Initial state correction, set it and dip out
		if (this.parser.currentTimestamp <= this.parser.fight.start_time) {
			this._activeFist = stanceId
			return
		}

		const duration = this.parser.currentTimestamp - this._lastFistChange
		if (duration > 0) {
			if (!this._fistUptime.hasOwnProperty(this._activeFist)) {
				this._fistUptime[this._activeFist] = duration
			} else {
				this._fistUptime[this._activeFist] += duration
			}
		}

		this._lastFistChange = this.parser.currentTimestamp
		this._activeFist = stanceId
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)

		// If we don't have a valid action or it's not a GCD, skip
		if (!action || !action.onGcd) {
			return
		}

		// Ignore Meditation and Form Shift
		if ([ACTIONS.MEDITATION.id, ACTIONS.FORM_SHIFT.id].includes(action.id)) {
			return
		}

		// By the time we get here, _activeFist should be correct
		if (!this._fistGCDs.hasOwnProperty(this._activeFist)) {
			this._fistGCDs[this._activeFist] = 0
		}

		this._fistGCDs[this._activeFist]++
	}

	_onGain(event) {
		this._handleFistChange(event.ability.guid)
	}

	_onRemove(event) {
		// If we're removing a fist that isn't active, it's just log order weirdness due to timestamps
		if (this._activeFist === event.ability.guid) {
			this._handleFistChange(STANCELESS)
		}
	}

	_onComplete() {
		// Flush the last stance
		this._handleFistChange(STANCELESS)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_FIRE.icon,
			content: <Fragment>
				Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...ACTIONS.FISTS_OF_FIRE} /> or <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> manipulation with <ActionLink {...ACTIONS.FISTS_OF_EARTH} /> and <ActionLink {...ACTIONS.FISTS_OF_WIND} />.
			</Fragment>,
			why: `${this._fistGCDs[STANCELESS]} GCDs had no Fists buff active.`,
			tiers: STANCELESS_SEVERITY,
			value: this._fistGCDs[STANCELESS],
		}))

		// Semi lenient trigger, this assumes RoE is only used during downtime
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_EARTH.icon,
			content: <Fragment>
				When using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} />, remember to change back
				to <StatusLink {...STATUSES.FISTS_OF_FIRE} /> as soon as possible.
			</Fragment>,
			tiers: EARTH_SEVERITY,
			why: <Fragment>
				<StatusLink {...STATUSES.FISTS_OF_EARTH} /> was active for {this._fistGCDs[STATUSES.FISTS_OF_EARTH.id]} GCDs.
			</Fragment>,
			value: this._fistGCDs[STATUSES.FISTS_OF_EARTH.id],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_WIND.icon,
			content: <Fragment>
				When using <ActionLink {...ACTIONS.RIDDLE_OF_WIND} />, remember to change back
				to <StatusLink {...STATUSES.FISTS_OF_FIRE} /> as soon as possible.
			</Fragment>,
			tiers: WIND_SEVERITY,
			why: <Fragment>
				<StatusLink {...STATUSES.FISTS_OF_WIND} /> was active for {this._fistGCDs[STATUSES.FISTS_OF_WIND.id]} GCDs.
			</Fragment>,
			value: this._fistGCDs[STATUSES.FISTS_OF_WIND.id],
		}))
	}

	getStanceUptimePercent(stanceId) {
		const statusUptime = this.combatants.getStatusUptime(stanceId)

		return ((statusUptime / this.parser.fightDuration) * 100).toFixed(2)
	}

	getStanceName(stanceId) {
		if (stanceId === STANCELESS) {
			return 'Stanceless'
		}

		// If this fucking errors...
		return getStatus(stanceId).name
	}

	output() {
		const uptimeKeys = Object.keys(this._fistUptime).map(Number)

		const data = uptimeKeys.map(id => {
			const value = this._fistUptime[id]
			return {
				value,
				label: this.getStanceName(id),
				backgroundColor: CHART_COLOURS[id],
				additional: [
					this.parser.formatDuration(value),
					this.getStanceUptimePercent(id) + '%',
				],
			}
		})

		return <PieChartWithLegend
			headers={{
				label: 'Stance',
				additional: [
					'Uptime',
					'%',
				],
			}}
			data={data}
		/>
	}
}
