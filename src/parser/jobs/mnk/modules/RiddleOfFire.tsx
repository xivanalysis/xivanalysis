import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Expected GCDs and buffs
// technically can get 2 tacles and should as much as possible, but don't ding for it in case it's for mechanics
const EXPECTED = {
	GCDS: 11,
	ELIXIRS: 1,
	TACKLES: 1,
	TORNADOES: 1,
}

const SUGGESTION_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

class Riddle {
	data: Data
	casts: Array<Events['action']>
	start: number
	end?: number
	rushing: boolean = false

	constructor(start: number, data: Data) {
		this.data = data
		this.start = start
		this.casts = []
	}

	get gcds() {
		return this.casts.filter(event => {
			const action = this.data.getAction(event.action)
			return action?.onGcd
		}).length
	}

	get chakras() {
		return this.casts.filter(event => event.action === this.data.actions.THE_FORBIDDEN_CHAKRA.id).length
	}

	get elixirFields() {
		return this.casts.filter(event => event.action === this.data.actions.ELIXIR_FIELD.id).length
	}

	get meditations() {
		return this.casts.filter(event => event.action === this.data.actions.MEDITATION.id).length
	}

	get tackles() {
		return this.casts.filter(event => event.action === this.data.actions.SHOULDER_TACKLE.id).length
	}

	get tornadoKicks() {
		return this.casts.filter(event => event.action === this.data.actions.TORNADO_KICK.id).length
	}

	get stars() {
		return this.casts.filter(event => event.action === this.data.actions.SIX_SIDED_STAR.id).length
	}
}

export class RiddleOfFire extends Analyser {
	static override handle = 'riddleoffire'
	static override title = t('mnk.rof.title')`Riddle of Fire`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private history: Riddle[] = []
	private riddle?: Riddle
	private riddleHook?: EventHook<Events['action']>

	override initialise(): void {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.RIDDLE_OF_FIRE.id), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.RIDDLE_OF_FIRE.id), this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		if (action == null) {
			return
		}

		// MNK mentors want the oGCDs :angryeyes:
		if (this.riddle != null) {
			this.riddle.casts.push(event)
		}
	}

	private onGain(event: Events['statusApply']): void {
		if (this.riddle == null) {
			this.riddle = new Riddle(event.timestamp, this.data)
			this.riddle.rushing = this.data.statuses.RIDDLE_OF_FIRE.duration >= (this.parser.pull.timestamp + this.parser.pull.duration) - event.timestamp

			this.riddleHook = this.addEventHook(filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
			, this.onCast)
		}
	}

	private onDrop(event: Events['statusRemove']): void {
		this.stopAndSave(event.timestamp)
	}

	private stopAndSave(endTime: number = this.parser.currentEpochTimestamp): void {
		if (this.riddle != null) {
			this.riddle.end = endTime

			this.history.push(this.riddle)

			if (this.riddleHook != null) {
				this.removeEventHook(this.riddleHook)
				this.riddleHook = undefined
			}
		}

		this.riddle = undefined
	}

	private onComplete(): void {
		// Close up if RoF was active at the end of the fight
		if (this.riddle != null) {
			this.stopAndSave()
		}

		// eslint-disable-next-line no-console
		console.log(this.history)

		const nonRushedRiddles = this.history
			.filter(riddle => !riddle.rushing)

		// We count 6SS as 2 GCDs, since it's sometimes not a bad thing
		// We remove Meditation since it's effectively a dropped GCD anyway
		const droppedGcds = (nonRushedRiddles.length * EXPECTED.GCDS)
			- nonRushedRiddles.reduce((sum, riddle) => sum + riddle.gcds + riddle.stars - riddle.meditations, 0)

		const droppedElixirFields = (nonRushedRiddles.length) // should be 1 per Riddle
			- nonRushedRiddles.reduce((sum, riddle) => sum + riddle.elixirFields, 0)

		const droppedTornadoKicks = (nonRushedRiddles.length) // should be 1 per Riddle
		- nonRushedRiddles.reduce((sum, riddle) => sum + riddle.tornadoKicks, 0)

		// Keep these seperate for different suggestions; our baseline is 1 charge, but the MNK mentors
		// want a minor suggestion to track Riddles that only had 1 Tackle
		const riddlesWithOneTackle = nonRushedRiddles.filter(riddle => riddle.tackles === 1).length
		const riddlesWithZeroTackles = nonRushedRiddles.filter(riddle => riddle.tackles === 0).length
		const droppedExpectedOgcds = droppedElixirFields + droppedTornadoKicks + riddlesWithZeroTackles

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RIDDLE_OF_FIRE.icon,
			content: <Trans id="mnk.rof.suggestions.gcd.content">
				Aim to hit {EXPECTED.GCDS} GCDs during each <DataLink status="RIDDLE_OF_FIRE"/> window.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedGcds,
			why: <Trans id="mnk.rof.suggestions.gcd.why">
				<Plural value={droppedGcds} one="# possible GCD was" other="# possible GCDs were" /> missed or wasted on <DataLink action="MEDITATION"/> during <DataLink status="RIDDLE_OF_FIRE"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ELIXIR_FIELD.icon,
			content: <Trans id="mnk.rof.suggestions.ogcd.content">
				Aim to use <ADataLink action="TORNADO_KICK"/>, <DataLink action="ELIXIR_FIELD"/>, and at least 1 <DataLink action="SHOULDER_TACKLE"/> during each <DataLink status="RIDDLE_OF_FIRE"/>.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedExpectedOgcds,
			why: <Trans id="mnk.rof.suggestions.ogcd.why">
				<Plural value={droppedExpectedOgcds} one="# expected oGCD was" other="# expected oGCDs were" /> dropped during <DataLink status="RIDDLE_OF_FIRE"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SHOULDER_TACKLE.icon,
			content: <Trans id="mnk.rof.suggestions.tackle.content">
				Try to use both charges of <DataLink action="SHOULDER_TACKLE"/> during <DataLink statu="RIDDLE_OF_FIRE"/>, unless you need to hold a charge for strategic purposes.
			</Trans>,
			tiers: {
				2: SEVERITY.MINOR,	// Always a minor suggestion, however we start from 2 to forgive ST on pull
			},
			value: riddlesWithOneTackle,
			why: <Trans id="mnk.rof.suggestions.tackle.why">
				<Plural value={riddlesWithOneTackle} one="# use" other="# uses" /> of <DataLink status="RIDDLE_OF_FIRE"/> contained only one use of <DataLink action="SHOULDER_TACKLE"/>.
			</Trans>,
		}))
	}

	override output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="mnk.rof.table.header.gcds">GCDs</Trans>,
					accessor: 'gcds',
				},
				{
					header: <DataLink showName={false} action="THE_FORBIDDEN_CHAKRA"/>,
					accessor: 'forbiddenChakra',
				},
				{
					header: <DataLink showName={false} action="TORNADO_KICK"/>,
					accessor: 'tornadoKick',
				},
				{
					header: <DataLink showName={false} action="ELIXIR_FIELD"/>,
					accessor: 'elixirField',
				},
				{
					header: <DataLink showName={false} action="SHOULDER_TACKLE"/>,
					accessor: 'shoulderTackle',
				},
			]}
			data={this.history
				.map(riddle => ({
					start: riddle.start - this.parser.pull.timestamp,
					end: riddle.end != null ?
						riddle.end - this.parser.pull.timestamp
						: riddle.start - this.parser.pull.timestamp,
					targetsData: {
						gcds: {
							actual: riddle.gcds - riddle.meditations,
							expected: EXPECTED.GCDS - riddle.stars,
						},
						forbiddenChakra: {
							actual: riddle.chakras,
						},
						tornadoKick: {
							actual: riddle.tornadoKicks,
							expected: EXPECTED.TORNADOES,
						},
						elixirField: {
							actual: riddle.elixirFields,
							expected: EXPECTED.ELIXIRS,
						},
						shoulderTackle: {
							actual: riddle.tackles,
							expected: EXPECTED.TACKLES,
						},
					},
					rotation: riddle.casts,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}
}
