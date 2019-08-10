import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import _ from 'lodash'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'

import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const FISTLESS = 0

const FISTS = [
	STATUSES.FISTS_OF_EARTH.id,
	STATUSES.FISTS_OF_FIRE.id,
	STATUSES.FISTS_OF_WIND.id,
]

const CHART_COLOURS = {
	[FISTLESS]: '#888',
	[STATUSES.FISTS_OF_EARTH.id]: Color(JOBS.MONK.colour),   // idk it matches
	[STATUSES.FISTS_OF_FIRE.id]: Color(JOBS.WARRIOR.colour), // POWER
	[STATUSES.FISTS_OF_WIND.id]: Color(JOBS.PALADIN.colour), // only good for utility
}

const FIST_SEVERITY = {
	FISTLESS: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	// Forced disengaging is rarely more than 2 GCDs
	FISTS_OF_EARTH: {
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	// Opener is 7 FoF GCDs, a user might also get forced into a GL3 burst at the end of a fight
	// but if they can hit 9 there, they can probably hit 10 in GL4 anyway since they're getting
	// a full RoF window. 10+ is always going to be a mistake. This is kinda weird tho since it's
	// severity per window rather than a whole fight unlike FoE or no fist.
	FISTS_OF_FIRE: {
		8: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		10: SEVERITY.MAJOR,
	},
}

class Fist {
	id: number = FISTLESS
	start: number = 0
	end?: number
	gcdCounter: number = 0

	constructor(fistId: number, start: number) {
		this.id = fistId
		this.start = start
	}
}

export default class Fists extends Module {
	static handle = 'fists'
	static title = t('mnk.fists.title')`Fists`
	static displayOrder = DISPLAY_ORDER.FISTS

	@dependency private combatants!: Combatants
	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions

	private fistory: Fist[] = []
	// Assume stanceless by default
	//  if there's a pre-start applybuff, it'll get corrected, and if not, it's already correct
	private activeFist: Fist = new Fist(FISTLESS, this.parser.fight.start_time)

	protected init(): void {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('applybuff', {to: 'player', abilityId: FISTS}, this.onGain)
		this.addHook('removebuff', {to: 'player', abilityId: FISTS}, this.onRemove)
		this.addHook('complete', this.onComplete)
	}

	private handleFistChange(fistId: number): void {
		// Initial state correction, set it and dip out
		if (this.parser.currentTimestamp <= this.parser.fight.start_time) {
			this.activeFist = new Fist(fistId, this.parser.currentTimestamp)
			return
		}

		if (this.activeFist.id !== fistId) {
			this.activeFist.end = this.parser.currentTimestamp
		}

		this.fistory.push(this.activeFist)
		this.activeFist = new Fist(fistId, this.parser.currentTimestamp)
	}

	private onCast(event: CastEvent): void {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO // should be Action type

		// If we don't have a valid action or it's not a GCD, skip
		if (!action || !action.onGcd) {
			return
		}

		// Ignore Meditation and Form Shift
		if ([ACTIONS.MEDITATION.id, ACTIONS.FORM_SHIFT.id].includes(action.id)) {
			return
		}

		// By the time we get here, _activeFist should be correct
		this.activeFist.gcdCounter++
	}

	private onGain(event: BuffEvent): void {
		this.handleFistChange(event.ability.guid)
	}

	private onRemove(event: BuffEvent): void {
		// If we're removing a fist that isn't active, it's just log order weirdness due to timestamps
		if (this.activeFist.id === event.ability.guid) {
			this.handleFistChange(FISTLESS)
		}
	}

	private onComplete(): void {
		// Flush the last stance
		this.fistory.push({...this.activeFist, end: this.parser.fight.end_time})

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_FIRE.icon,
			content: <Trans id="mnk.fists.suggestions.stanceless.content">
				Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...ACTIONS.FISTS_OF_FIRE} />, <StatusLink {...STATUSES.GREASED_LIGHTNING} /> manipulation with <ActionLink {...ACTIONS.FISTS_OF_EARTH} />, and outright more GCDs with <ActionLink {...ACTIONS.FISTS_OF_WIND} />.
			</Trans>,
			why: <Trans id="mnk.fists.suggestions.stanceless.why">
				<Plural value={this.getFistGCDCount(FISTLESS)} one="# GCD" other="# GCDs"	/> had no Fists buff active.
			</Trans>,
			tiers: FIST_SEVERITY.FISTLESS,
			value: this.getFistGCDCount(FISTLESS),
		}))

		// Semi lenient trigger, this assumes RoE is only used during downtime
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_EARTH.icon,
			content: <Trans id="mnk.fists.suggestions.foe.content">
				When using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} />, remember to change back to <StatusLink {...STATUSES.FISTS_OF_WIND} /> as soon as possible.
			</Trans>,
			tiers: FIST_SEVERITY.FISTS_OF_EARTH,
			why: <Trans id="mnk.fists.suggestions.foe.why">
				<StatusLink {...STATUSES.FISTS_OF_EARTH} /> was active for <Plural value={this.getFistGCDCount(STATUSES.FISTS_OF_EARTH.id)} one="# GCD" other="# GCDs"/>.
			</Trans>,
			value: this.getFistGCDCount(STATUSES.FISTS_OF_EARTH.id),
		}))

		// TODO: Add check for FoF GCD counts, per window, being larger than expected

		// Statistics
		const uptimeKeys = _.uniq(this.fistory.map(fist => fist.id))

		const data = uptimeKeys.map(id => {
			const value = this.fistory
				.filter(fist => fist.id === id)
				.reduce((total, current) => total + (current.end || this.parser.fight.end_time) - current.start, 0)
			return {
				value,
				color: CHART_COLOURS[id] as string,
				columns: [
					this.getFistName(id),
					this.parser.formatDuration(value),
					this.getFistUptimePercent(id) + '%',
				] as TODO,
			}
		})

		this.statistics.add(new PieChartStatistic({
			headings: ['Fist', 'Uptime', '%'],
			data,
		}))
	}

	getFistGCDCount(fistId: number): number {
		return this.fistory
			.filter(fist => fist.id === fistId)
			.reduce((total, current) => total + current.gcdCounter, 0)
	}

	getFistUptimePercent(fistId: number): string {
		const statusUptime = this.combatants.getStatusUptime(fistId)

		return ((statusUptime / this.parser.fightDuration) * 100).toFixed(2)
	}

	getFistName(fistId: number): string {
		if (fistId === FISTLESS) {
			// NOTE: Do /not/ return a <Trans> here - it will cause Chart.js to try and clone the entire react tree.
			// TODO: Work out how to translate this shit.
			return 'Fistless'
		}

		// If this fucking errors...
		const status = getDataBy(STATUSES, 'id', fistId) as TODO // this should be a Status or Buff?
		return status.name
	}
}
