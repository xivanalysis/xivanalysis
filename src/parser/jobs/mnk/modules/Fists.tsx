import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import JOBS from 'data/JOBS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {FISTLESS, FISTS} from './constants'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {fillStatuses} from './utilities'

const SUGGESTION_TIERS = {
	DOUSED: {
		1: SEVERITY.MAJOR,
	},
	FISTS_OF_EARTH: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

type FistId = Status['id'] | typeof FISTLESS

type ChartColours = {
	[key in FistId]: string
}

class Fist {
	id: FistId = FISTLESS
	start: number = 0
	end?: number
	gcdCounter: number = 0

	constructor(fistId: FistId, start: number) {
		this.id = fistId
		this.start = start
	}
}

export class Fists extends Analyser {
	static override handle = 'fists'
	static override title = t('mnk.fists.title')`Fists`
	static override displayOrder = DISPLAY_ORDER.FISTS

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statistics!: Statistics
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	private chartColours: ChartColours = {[FISTLESS]: '#888'}
	private fists: Array<Status['id']> = []
	private fistory: Fist[] = []
	private fistHook?: EventHook<Events['action']>

	// Assume FoF by default
	//  if there's a pre-start applybuff, it'll get corrected, and if not, it's already correct
	private activeFist: Fist = new Fist(this.data.statuses.FISTS_OF_FIRE.id, this.parser.pull.timestamp)

	override initialise(): void {
		this.chartColours = {
			...this.chartColours,
			[this.data.statuses.FISTS_OF_EARTH.id]: JOBS.MONK.colour,   // idk it matches
			[this.data.statuses.FISTS_OF_FIRE.id]: JOBS.WARRIOR.colour, // POWER
			[this.data.statuses.FISTS_OF_WIND.id]: JOBS.PALADIN.colour, // only good for utility
		}

		this.fists = fillStatuses(FISTS, this.data)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(oneOf(this.fists)), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(oneOf(this.fists)), this.onRemove)

		this.addEventHook('complete', this.onComplete)
	}

	private handleFistChange(fistId: FistId): void {
		// Initial state correction, set it and dip out
		if (this.parser.currentEpochTimestamp <= this.parser.pull.timestamp) {
			this.activeFist = new Fist(fistId, this.parser.currentEpochTimestamp)
			return
		}

		if (this.activeFist.id !== fistId) {
			this.activeFist.end = this.parser.currentEpochTimestamp
		}

		this.fistory.push(this.activeFist)
		this.activeFist = new Fist(fistId, this.parser.currentEpochTimestamp)
	}

	private onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		// If we don't have a valid action or it's not a GCD, skip
		if (action == null || !(action.onGcd ?? false)) { return }

		// Ignore Meditation and Form Shift
		if ([this.data.actions.MEDITATION.id, this.data.actions.FORM_SHIFT.id].includes(action.id)) {
			return
		}

		this.activeFist.gcdCounter++
	}

	private onGain(event: Events['statusApply']): void {
		const status = this.data.getStatus(event.status)

		if (status == null) {
			return
		}

		this.fistHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action'),
			this.onCast,
		)

		this.handleFistChange(event.status)
	}

	private onRemove(event: Events['statusRemove']): void {
		// If we're removing a fist that isn't active, it's just log order weirdness due to timestamps
		if (this.activeFist.id === event.status) {
			this.handleFistChange(FISTLESS)
		}

		if (this.fistHook != null) {
			this.removeEventHook(this.fistHook)
			this.fistHook = undefined
		}
	}

	private onComplete(): void {
		// Flush the last stance
		this.fistory.push({...this.activeFist, end: this.parser.pull.timestamp + this.parser.pull.duration})

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FISTS_OF_FIRE.icon,
			content: <Trans id="mnk.fists.suggestions.stanceless.content">
				Fist buffs are one of your biggest DPS contributors, either directly with <DataLink action="FISTS_OF_FIRE"/> or by avoiding death with <DataLink action="FISTS_OF_EARTH"/>.
			</Trans>,
			why: <Trans id="mnk.fists.suggestions.stanceless.why">
				<Plural value={this.getFistGCDCount(FISTLESS)} one="# GCD" other="# GCDs"	/> had no Fists buff active.
			</Trans>,
			tiers: SUGGESTION_TIERS.DOUSED,
			value: this.getFistGCDCount(FISTLESS),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FISTS_OF_EARTH.icon,
			content: <Trans id="mnk.fists.suggestions.foe.content">
				When using <DataLink action="FISTS_OF_EARTH"/>, remember to change back to <DataLink status="FISTS_OF_FIRE"/> as soon as possible.
			</Trans>,
			tiers: SUGGESTION_TIERS.FISTS_OF_EARTH,
			why: <Trans id="mnk.fists.suggestions.foe.why">
				<DataLink status="FISTS_OF_EARTH"/> was active for <Plural value={this.getFistGCDCount(this.data.statuses.FISTS_OF_EARTH.id)} one="# GCD" other="# GCDs"/>.
			</Trans>,
			value: this.getFistGCDCount(this.data.statuses.FISTS_OF_EARTH.id),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FISTS_OF_WIND.icon,
			content: <Trans id="mnk.fists.suggestions.fow.content">
				Using <DataLink action="FISTS_OF_WIND"/> provides no combat benefit. Try to stay in <DataLink status="FISTS_OF_FIRE"/> as much as possible.
			</Trans>,
			tiers: SUGGESTION_TIERS.DOUSED,
			why: <Trans id="mnk.fists.suggestions.fow.why">
				<DataLink status="FISTS_OF_WIND"/> was active for <Plural value={this.getFistGCDCount(this.data.statuses.FISTS_OF_WIND.id)} one="# GCD" other="# GCDs"/>.
			</Trans>,
			value: this.getFistGCDCount(this.data.statuses.FISTS_OF_WIND.id),
		}))

		// Statistics
		const uptimeKeys = _.uniq(this.fistory.map(fist => fist.id))

		const data = uptimeKeys.map(id => {
			const value = this.fistory
				.filter(fist => fist.id === id)
				.reduce((total, current) => total + (current.end || this.parser.pull.timestamp + this.parser.pull.duration) - current.start, 0)
			return {
				value,
				color: this.chartColours[id],
				columns: [
					this.getFistName(id),
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

	getFistGCDCount(fistId: FistId): number {
		return this.fistory
			.filter(fist => fist.id === fistId)
			.reduce((total, current) => total + current.gcdCounter, 0)
	}

	getFistUptimePercent(fistId: FistId): string {
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		let statusUptime: number = 0

		// Check for a real status first, because Fistless will need to check total time against all the others
		if (fistId === FISTLESS) {
			const fistUptime = this.fists.reduce((total, fist) => {
				const status = this.data.getStatus(fist)
				if (status == null) { return total }

				return total + this.statuses.getUptime(status, this.actors.current)
			}, 0)

			statusUptime = fightUptime - fistUptime
		} else {
			const status = this.data.getStatus(fistId)
			if (status == null) { return '0' }

			statusUptime = this.statuses.getUptime(status, this.actors.current)

		}

		// No status events for this fist, assume 100% uptime
		if (statusUptime === 0) {
			return '100'
		}

		return ((statusUptime / fightUptime) * 100).toFixed(2)
	}

	getFistName(fistId: FistId): string {
		if (fistId === FISTLESS) {
			// NOTE: Do /not/ return a <Trans> here - it will cause Chart.js to try and clone the entire react tree.
			// TODO: Work out how to translate this shit.
			return 'Fistless'
		}

		const status = this.data.getStatus(fistId)

		if (status != null && this.fists.includes(status.id)) {
			return status.name
		}

		return 'Unknown'
	}
}
