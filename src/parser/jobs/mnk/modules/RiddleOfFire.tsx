import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {BLITZ_SKILLS} from './constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {fillActions} from './utilities'

// Expected GCDs and buffs
// technically can get 2 tacles and should as much as possible, but don't ding for it in case it's for mechanics
const EXPECTED = {
	GCDS: 11,
	BLITZES: 1,
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
		return this.casts
			.filter(event => this.data.getAction(event.action)?.onGcd ?? false)
			.length
	}

	get chakras() {
		return this.casts.filter(event => event.action === this.data.actions.THE_FORBIDDEN_CHAKRA.id).length
	}

	get meditations() {
		return this.casts.filter(event => event.action === this.data.actions.MEDITATION.id).length
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

	private blitzActions: Array<Action['id']> = []

	override initialise(): void {
		this.blitzActions = fillActions(BLITZ_SKILLS, this.data)
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.RIDDLE_OF_FIRE.id), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.RIDDLE_OF_FIRE.id), this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		if (action == null) { return }

		// MNK mentors want the oGCDs :angryeyes:
		if (this.riddle != null) {
			this.riddle.casts.push(event)
		}
	}

	private onGain(event: Events['statusApply']): void {
		if (this.riddle != null) { return }

		this.riddle = new Riddle(event.timestamp, this.data)
		this.riddle.rushing = this.data.statuses.RIDDLE_OF_FIRE.duration >= (this.parser.pull.timestamp + this.parser.pull.duration) - event.timestamp

		this.riddleHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action'),
			this.onCast,
		)
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
		this.stopAndSave()

		const nonRushedRiddles = this.history
			.filter(riddle => !riddle.rushing)

		// We count 6SS as 2 GCDs, since it's sometimes not a bad thing
		// We remove Meditation since it's effectively a dropped GCD anyway
		const droppedGcds = (nonRushedRiddles.length * EXPECTED.GCDS)
			- nonRushedRiddles.reduce((sum, riddle) => sum + riddle.gcds + riddle.stars - riddle.meditations, 0)

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
					header: <DataLink showName={false} action="MASTERFUL_BLITZ"/>,
					accessor: 'blitzes',
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
						blitzes: {
							actual: riddle.casts.filter(event => this.blitzActions.includes(event.action)).length,
							expected: EXPECTED.BLITZES,
						},
					},
					rotation: riddle.casts,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}
}
