import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import Fists, {FISTLESS, Fist} from './Fists'

const ROF_DURATION = STATUSES.RIDDLE_OF_FIRE.duration

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
	casts: CastEvent[]
	start: number
	end?: number
	active: boolean = false
	rushing: boolean = false
	gcdsInEachFist: { [fistId: number]: number } = {
		[FISTLESS]: 0,
		[STATUSES.FISTS_OF_EARTH.id]: 0,
		[STATUSES.FISTS_OF_FIRE.id]: 0,
		[STATUSES.FISTS_OF_WIND.id]: 0,
	}

	constructor(start: number, data: Data) {
		this.data = data
		this.start = start
		this.casts = []
	}

	get gcds() {
		return this.casts.filter(event => {
			const action = this.data.getAction(event.ability.guid)
			return action?.onGcd
		}).length
	}

	get chakras() {
		return this.casts.filter(event => event.ability.guid === this.data.actions.THE_FORBIDDEN_CHAKRA.id).length
	}

	get elixirFields() {
		return this.casts.filter(event => event.ability.guid === this.data.actions.ELIXIR_FIELD.id).length
	}

	get meditations() {
		return this.casts.filter(event => event.ability.guid === this.data.actions.MEDITATION.id).length
	}

	get tackles() {
		return this.casts.filter(event => event.ability.guid === this.data.actions.SHOULDER_TACKLE.id).length
	}

	get tornadoKicks() {
		return this.casts.filter(event => event.ability.guid === this.data.actions.TORNADO_KICK.id).length
	}

	get stars() {
		return this.casts.filter(event => event.ability.guid === this.data.actions.SIX_SIDED_STAR.id).length
	}

	public gcdsByFist(fistId: number) {
		return this.gcdsInEachFist[fistId]
	}
}

export default class RiddleOfFire extends Module {
	static override handle = 'riddleoffire'
	static override title = t('mnk.rof.title')`Riddle of Fire`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency private data!: Data
	@dependency private fists!: Fists
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private history: Riddle[] = []
	private riddle?: Riddle

	protected override init(): void {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('removebuff', {by: 'player', abilityId: this.data.statuses.RIDDLE_OF_FIRE.id}, this.onDrop)
		this.addEventHook('complete', this.onComplete)
	}

	onCast(event: CastEvent): void {
		const action = this.data.getAction(event.ability.guid)

		if (!action) {
			return
		}

		if (action.id === this.data.actions.RIDDLE_OF_FIRE.id) {
			this.riddle = new Riddle(event.timestamp, this.data)

			this.riddle.active = true
			this.riddle.rushing = ROF_DURATION >= this.parser.fight.end_time - event.timestamp
			return
		}

		// MNK mentors want the oGCDs :angryeyes:
		if (this.riddle?.active) {
			this.riddle.casts.push(event)

			if (action.onGcd) {
				const activeFist: Fist = this.fists.getActiveFist()
				this.riddle.gcdsInEachFist[activeFist.id]++
			}
		}
	}

	private onDrop(event: BuffEvent): void {
		this.stopAndSave(event.timestamp)
	}

	private onComplete(): void {
		// Close up if RoF was active at the end of the fight
		if (this.riddle?.active) {
			this.stopAndSave()
		}

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
				Aim to hit {EXPECTED.GCDS} GCDs during each <StatusLink {...this.data.statuses.RIDDLE_OF_FIRE} /> window.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedGcds,
			why: <Trans id="mnk.rof.suggestions.gcd.why">
				<Plural value={droppedGcds} one="# possible GCD was" other="# possible GCDs were" /> missed or wasted on <ActionLink {...this.data.actions.MEDITATION} /> during <StatusLink {...this.data.statuses.RIDDLE_OF_FIRE} />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ELIXIR_FIELD.icon,
			content: <Trans id="mnk.rof.suggestions.ogcd.content">
				Aim to use <ActionLink {...this.data.actions.TORNADO_KICK} />, <ActionLink {...this.data.actions.ELIXIR_FIELD} />, and at least 1 <ActionLink {...this.data.actions.SHOULDER_TACKLE} /> during each <StatusLink {...this.data.statuses.RIDDLE_OF_FIRE} />.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedExpectedOgcds,
			why: <Trans id="mnk.rof.suggestions.ogcd.why">
				<Plural value={droppedExpectedOgcds} one="# expected oGCD was" other="# expected oGCDs were" /> dropped
				during <StatusLink {...this.data.statuses.RIDDLE_OF_FIRE} />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SHOULDER_TACKLE.icon,
			content: <Trans id="mnk.rof.suggestions.tackle.content">
				Try to use both charges of <ActionLink {...this.data.actions.SHOULDER_TACKLE} /> during <StatusLink {...this.data.statuses.RIDDLE_OF_FIRE} />,
				unless you need to hold a charge for strategic purposes.
			</Trans>,
			tiers: {
				2: SEVERITY.MINOR,	// Always a minor suggestion, however we start from 2 to forgive ST on pull
			},
			value: riddlesWithOneTackle,
			why: <Trans id="mnk.rof.suggestions.tackle.why">
				<Plural value={riddlesWithOneTackle} one="# use" other="# uses" /> of <StatusLink {...this.data.statuses.RIDDLE_OF_FIRE} /> contained
				only one use of <ActionLink {...this.data.actions.SHOULDER_TACKLE} />.
			</Trans>,
		}))
	}

	private stopAndSave(endTime: number = this.parser.currentTimestamp): void {
		if (this.riddle?.active) {
			this.riddle.active = false
			this.riddle.end = endTime

			this.history.push(this.riddle)
		}
	}

	override output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="mnk.rof.table.header.gcds">GCDs</Trans>,
					accessor: 'gcds',
				},
				{
					header: <ActionLink showName={false} {...this.data.actions.THE_FORBIDDEN_CHAKRA}/>,
					accessor: 'forbiddenChakra',
				},
				{
					header: <ActionLink showName={false} {...this.data.actions.TORNADO_KICK}/>,
					accessor: 'tornadoKick',
				},
				{
					header: <ActionLink showName={false} {...this.data.actions.ELIXIR_FIELD}/>,
					accessor: 'elixirField',
				},
				{
					header: <ActionLink showName={false} {...this.data.actions.SHOULDER_TACKLE}/>,
					accessor: 'shoulderTackle',
				},
			]}
			data={this.history
				.map(riddle => ({
					start: riddle.start - this.parser.fight.start_time,
					end: riddle.end != null ?
						riddle.end - this.parser.fight.start_time
						: riddle.start - this.parser.fight.start_time,
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
