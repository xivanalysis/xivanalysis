import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import React from 'react'
import PieChartWithLegend from 'components/ui/PieChartWithLegend'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'

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

	static title = t('mnk.fists.title')`Fists`
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

			// Ignore any non-ability events
			if (!event.ability) {
				continue
			}

			// We got a remove (PrecastStatus will handle this), or an initial apply
			if (['removebuff', 'applybuff'].includes(event.type) && STANCES.includes(event.ability.guid)) {
				break
			}

			// Check for any specific casts that imply stance
			if (event.type === 'cast') {
				// They dun goofed
				if (event.ability.guid === ACTIONS.SHOULDER_TACKLE.id) {
					break
				}

				// It was a legit Tackle, we know what's up
				if (Object.keys(STANCE_MAP).map(Number).includes(event.ability.guid)) {
					const status = getDataBy(STATUSES, 'id', STANCE_MAP[event.ability.guid])

					events.splice(0, 0, {
						...event,
						ability: {
							abilityIcon: status.abilityIcon,
							guid: status.id,
							name: status.name,
							type: 1,
						},
						targetID: event.sourceID,
						targetIsFriendly: true,
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
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)

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
			content: <Trans id="mnk.fists.suggestions.stanceless.content">
				Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...ACTIONS.FISTS_OF_FIRE} /> or <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> manipulation with <ActionLink {...ACTIONS.FISTS_OF_EARTH} /> and <ActionLink {...ACTIONS.FISTS_OF_WIND} />.
			</Trans>,
			why: <Trans id="mnk.fists.suggestions.stanceless.why">
				<Plural value={this._fistGCDs[STANCELESS]} one="# GCD" other="# GCDs"	/> had no Fists buff active.
			</Trans>,
			tiers: STANCELESS_SEVERITY,
			value: this._fistGCDs[STANCELESS],
		}))

		// Semi lenient trigger, this assumes RoE is only used during downtime
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_EARTH.icon,
			content: <Trans id="mnk.fists.suggestions.foe.content">
				When using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} />, remember to change back to <StatusLink {...STATUSES.FISTS_OF_FIRE} /> as soon as possible.
			</Trans>,
			tiers: EARTH_SEVERITY,
			why: <Trans id="mnk.fists.suggestions.foe.why">
				<StatusLink {...STATUSES.FISTS_OF_EARTH} /> was active for <Plural value={this._fistGCDs[STATUSES.FISTS_OF_EARTH.id]} one="# GCD" other="# GCDs"/>.
			</Trans>,
			value: this._fistGCDs[STATUSES.FISTS_OF_EARTH.id],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_WIND.icon,
			content: <Trans id="mnk.fists.suggestions.fow.content">
				When using <ActionLink {...ACTIONS.RIDDLE_OF_WIND} />, remember to change back to <StatusLink {...STATUSES.FISTS_OF_FIRE} /> as soon as possible.
			</Trans>,
			tiers: WIND_SEVERITY,
			why: <Trans id="mnk.fists.suggestions.fow.why">
				<StatusLink {...STATUSES.FISTS_OF_WIND} /> was active for <Plural value={this._fistGCDs[STATUSES.FISTS_OF_WIND.id]} one="# GCD" other="# GCDs"/>.
			</Trans>,
			value: this._fistGCDs[STATUSES.FISTS_OF_WIND.id],
		}))
	}

	getStanceUptimePercent(stanceId) {
		const statusUptime = this.combatants.getStatusUptime(stanceId)

		return ((statusUptime / this.parser.fightDuration) * 100).toFixed(2)
	}

	getStanceName(stanceId) {
		if (stanceId === STANCELESS) {
			// NOTE: Do /not/ return a <Trans> here - it will cause Chart.js to try and clone the entire react tree.
			// TODO: Work out how to translate this shit.
			return 'Stanceless'
		}

		// If this fucking errors...
		return getDataBy(STATUSES, 'id', stanceId).name
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
				label: <Trans id="mnk.fists.chart.header.stance">Stance</Trans>,
				additional: [
					<Trans id="mnk.fists.chart.header.uptime" key="mnk.fists.chart.header.uptime">Uptime</Trans>,
					'%',
				],
			}}
			data={data}
		/>
	}
}
