import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'

import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'

import {EntityStatuses} from '../../../core/modules/EntityStatuses'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import Gauge, {MAX_FASTER, MAX_STACKS} from './Gauge'

export const FISTLESS = 0

export const FISTS = [
	STATUSES.FISTS_OF_EARTH.id,
	STATUSES.FISTS_OF_FIRE.id,
	STATUSES.FISTS_OF_WIND.id,
]

const CHART_COLOURS = {
	[FISTLESS]: '#888',
	[STATUSES.FISTS_OF_EARTH.id]: JOBS.MONK.colour,   // idk it matches
	[STATUSES.FISTS_OF_FIRE.id]: JOBS.WARRIOR.colour, // POWER
	[STATUSES.FISTS_OF_WIND.id]: JOBS.PALADIN.colour, // only good for utility
}

const FIST_SEVERITY = {
	FISTLESS: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	// Opener is 7 FoF GCDs, a user might also get forced into a GL3 burst at the end of a fight
	// but if they can hit 9 there, they can probably hit 10-11 in GL4 anyway since they're getting
	// a full RoF window. 10+ is always going to be a mistake. This is kinda weird tho since it's
	// severity per window rather than a whole fight unlike FoE or no fist.
	FISTS_OF_FIRE: {
		8: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		10: SEVERITY.MAJOR,
	},
	// Forced disengaging is rarely more than 2 GCDs
	FISTS_OF_EARTH: {
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	// Allow one in case of borked openers but flag it.
	// Yes, I know it's a fart joke. I am 12 and what is this?
	// 6 for major mostly because it's half as bad as Fistless.
	FISTS_OF_WIND: {
		1: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
}

export class Fist {
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
	@dependency private data!: Data
	@dependency private gauge!: Gauge
	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions
	@dependency private entityStatuses!: EntityStatuses

	private fistory: Fist[] = []
	private foulWinds: number = 0

	// Assume stanceless by default
	//  if there's a pre-start applybuff, it'll get corrected, and if not, it's already correct
	private activeFist: Fist = new Fist(FISTLESS, this.parser.fight.start_time)

	protected init(): void {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('applybuff', {to: 'player', abilityId: FISTS}, this.onGain)
		this.addEventHook('removebuff', {to: 'player', abilityId: FISTS}, this.onRemove)
		this.addEventHook('complete', this.onComplete)
	}

	// Public API to get the Fist in use at a given time.
	public getFist = (timestamp: number): Fist =>
		this.fistory.filter(fist => fist.start <= timestamp && (fist.end ?? Infinity) >= timestamp)[0]

	// Public API to get the currently active Fist.
	public getActiveFist = (): Fist => this.activeFist

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
		const action = this.data.getAction(event.ability.guid)

		// If we don't have a valid action or it's not a GCD, skip
		if (!action?.onGcd) {
			return
		}

		// Ignore Meditation and Form Shift
		if ([ACTIONS.MEDITATION.id, ACTIONS.FORM_SHIFT.id].includes(action.id)) {
			return
		}

		this.activeFist.gcdCounter++
	}

	private onGain(event: BuffEvent): void {
		const status = this.data.getStatus(event.ability.guid)

		if (!status) {
			return
		}

		this.handleFistChange(event.ability.guid)

		// We only care about FoW from this point on
		if (event.ability.guid !== STATUSES.FISTS_OF_WIND.id) { return }

		// If player switches to FoW but they're not about to GL4
		const coeurl: boolean = this.combatants.selected.hasStatus(STATUSES.COEURL_FORM.id)
		const perbal: boolean = this.combatants.selected.hasStatus(STATUSES.PERFECT_BALANCE.id)

		if (this.gauge.stacks < MAX_STACKS || (this.gauge.stacks === MAX_STACKS && (!coeurl && !perbal))) {
			this.foulWinds++
		}
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

		const unknownFist = this.fistory.length === 1 && this.fistory[0].id === FISTLESS

		if (unknownFist) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FISTS_OF_FIRE.icon,
				content: <Trans id="mnk.fists.suggestions.unknownfist.content">
					Try to use <StatusLink {...STATUSES.FISTS_OF_FIRE} /> up to GL{MAX_STACKS} and <StatusLink {...STATUSES.FISTS_OF_WIND}/> for GL{MAX_FASTER}.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="mnk.fists.suggestions.unknownfist.why">
					No Fist transition was detected over the fight.
				</Trans>,
			}))
		} else {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.FISTS_OF_FIRE.icon,
				content: <Trans id="mnk.fists.suggestions.stanceless.content">
					Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...ACTIONS.FISTS_OF_FIRE} />, or outright more GCDs with <ActionLink {...ACTIONS.FISTS_OF_WIND} />.
				</Trans>,
				why: <Trans id="mnk.fists.suggestions.stanceless.why">
					<Plural value={this.getFistGCDCount(FISTLESS)} one="# GCD" other="# GCDs"	/> had no Fists buff active.
				</Trans>,
				tiers: FIST_SEVERITY.FISTLESS,
				value: this.getFistGCDCount(FISTLESS),
			}))

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

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.FISTS_OF_WIND.icon,
				content: <Trans id="mnk.fists.suggestions.fow.content">
					Avoid swapping to <StatusLink {...STATUSES.FISTS_OF_WIND}/> while below {MAX_STACKS} stacks until you're about to execute a <StatusLink {...STATUSES.COEURL_FORM} /> skill. <StatusLink {...STATUSES.FISTS_OF_FIRE} /> offers more damage until you can get to GL{MAX_FASTER}.
				</Trans>,
				why: <Trans id="mnk.fists.suggestions.fow.why">
					<StatusLink {...STATUSES.FISTS_OF_WIND}/> was activated <Plural value={this.foulWinds} one="# time" other="# times" /> below max stacks.
				</Trans>,
				tiers: FIST_SEVERITY.FISTS_OF_WIND,
				value: this.foulWinds,
			}))
		}

		// Statistics
		const uptimeKeys = _.uniq(this.fistory.map(fist => fist.id))

		const data = uptimeKeys.map(id => {
			const value = this.fistory
				.filter(fist => fist.id === id)
				.reduce((total, current) => total + (current.end || this.parser.fight.end_time) - current.start, 0)
			return {
				value,
				color: CHART_COLOURS[id],
				columns: [
					this.getFistName(id, unknownFist),
					this.parser.formatDuration(value),
					this.getFistUptimePercent(id) + '%',
				] as const,
			}
		}).filter(datum => datum.value > 0)

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
		const statusUptime = this.entityStatuses.getStatusUptime(fistId, this.combatants.getEntities())

		return ((statusUptime / this.parser.currentDuration) * 100).toFixed(2)
	}

	getFistName(fistId: number, missingData: boolean): string {
		if (!missingData) {
			if (fistId === FISTLESS) {
				// NOTE: Do /not/ return a <Trans> here - it will cause Chart.js to try and clone the entire react tree.
				// TODO: Work out how to translate this shit.
				return 'Fistless'
			}

			const status = this.data.getStatus(fistId)

			if (status) {
				return status.name
			}
		}

		return 'Unknown'
	}
}
