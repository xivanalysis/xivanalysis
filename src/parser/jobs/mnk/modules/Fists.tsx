import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
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
	// Forced disengaging is rarely more than 2 GCDs
	FISTS_OF_EARTH: {
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
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
	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions
	@dependency private entityStatuses!: EntityStatuses

	private fistory: Fist[] = []

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
		if ([this.data.actions.MEDITATION.id, this.data.actions.FORM_SHIFT.id].includes(action.id)) {
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
				icon: this.data.actions.FISTS_OF_FIRE.icon,
				content: <Trans id="mnk.fists.suggestions.unknownfist.content">
					Try to use <StatusLink {...this.data.statuses.FISTS_OF_FIRE} /> as much as you can entityStatusesas it provides a strong boost to your damage output.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="mnk.fists.suggestions.unknownfist.why">
					No Fist transition was detected over the fight.
				</Trans>,
			}))
		} else {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.FISTS_OF_FIRE.icon,
				content: <Trans id="mnk.fists.suggestions.stanceless.content">
					Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...this.data.actions.FISTS_OF_FIRE} /> or by avoiding death with <ActionLink {...this.data.actions.FISTS_OF_EARTH} />.
				</Trans>,
				why: <Trans id="mnk.fists.suggestions.stanceless.why">
					<Plural value={this.getFistGCDCount(FISTLESS)} one="# GCD" other="# GCDs"	/> had no Fists buff active.
				</Trans>,
				tiers: FIST_SEVERITY.FISTLESS,
				value: this.getFistGCDCount(FISTLESS),
			}))

			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.FISTS_OF_EARTH.icon,
				content: <Trans id="mnk.fists.suggestions.foe.content">
					When using <ActionLink {...this.data.actions.FISTS_OF_EARTH} />, remember to change back to <StatusLink {...this.data.statuses.FISTS_OF_FIRE} /> as soon as possible.
				</Trans>,
				tiers: FIST_SEVERITY.FISTS_OF_EARTH,
				why: <Trans id="mnk.fists.suggestions.foe.why">
					<StatusLink {...this.data.statuses.FISTS_OF_EARTH} /> was active for <Plural value={this.getFistGCDCount(this.data.statuses.FISTS_OF_EARTH.id)} one="# GCD" other="# GCDs"/>.
				</Trans>,
				value: this.getFistGCDCount(this.data.statuses.FISTS_OF_EARTH.id),
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
