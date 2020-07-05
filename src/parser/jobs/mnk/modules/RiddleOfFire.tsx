import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'

import DISPLAY_ORDER from './DISPLAY_ORDER'
import Fists, {FISTLESS} from './Fists'

const ROF_DURATION = STATUSES.RIDDLE_OF_FIRE.duration * 1000

// Expected under Fists of Wind with optimal play
const EXPECTED_GCDS = 11

const EXPECTED_ELIXIR_FIELDS = 1

// technically they can get 2 and should as much as possible, but don't ding for it in case it's for mechanics
const EXPECTED_SHOULDER_TACKLES = 1

const SUGGESTION_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
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
	expectedGcds: number = EXPECTED_GCDS // Baseline GL4 RoFs are 11 GCDs

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

	get elixirFields() {
		return this.casts.filter(event => event.ability.guid === ACTIONS.ELIXIR_FIELD.id).length
	}

	get tackles() {
		return this.casts.filter(event => event.ability.guid === ACTIONS.SHOULDER_TACKLE.id).length
	}

	public gcdsByFist(fistId: number) {
		return this.gcdsInEachFist[fistId]
	}
}

export default class RiddleOfFire extends Module {
	static handle = 'riddleoffire'
	static title = t('mnk.rof.title')`Riddle of Fire`
	static displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency private data!: Data
	@dependency private fists!: Fists
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private history: Riddle[] = []
	private riddle?: Riddle

	protected init(): void {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.RIDDLE_OF_FIRE.id}, this.onDrop)
		this.addEventHook('complete', this.onComplete)
	}

	onCast(event: CastEvent): void {
		const action = this.data.getAction(event.ability.guid)

		if (!action) {
			return
		}

		if (action.id === ACTIONS.RIDDLE_OF_FIRE.id) {
			this.riddle = new Riddle(event.timestamp, this.data)

			this.riddle.active = true
			this.riddle.rushing = ROF_DURATION >= this.parser.fight.end_time - event.timestamp
			return
		}

		// MNK mentors want the oGCDs :angryeyes:
		if (this.riddle?.active) {
			this.riddle.casts.push(event)

			if (action.onGcd) {
				const activeFist = this.fists.getActiveFist()
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

		// This could be redundant with GCDs spent not under Wind, but according to Tiff you should only
		// be in FoF during a rushed Riddle, so I'm not too worried about it.
		const droppedGcds = (nonRushedRiddles.length * EXPECTED_GCDS) // opener Riddle has 11 GCDs
			- nonRushedRiddles.reduce((sum, riddle) => sum + riddle.gcds, 0)

		const droppedElixirFields = (nonRushedRiddles.length) // should be 1 per Riddle
			- nonRushedRiddles.reduce((sum, riddle) => sum + riddle.elixirFields, 0)

		// Keep these seperate for different suggestions; our baseline is 1 charge, but the MNK mentors
		// want a minor suggestion to track Riddles that only had 1 Tackle
		const riddlesWithOneTackle = nonRushedRiddles.filter(riddle => riddle.tackles === 1).length
		const riddlesWithZeroTackles = nonRushedRiddles.filter(riddle => riddle.tackles === 0).length
		const droppedExpectedOgcds = droppedElixirFields + riddlesWithZeroTackles

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RIDDLE_OF_FIRE.icon,
			content: <Trans id="mnk.rof.suggestions.gcd.content">
				Aim to hit {EXPECTED_GCDS - 2} GCDs under GL3, or {EXPECTED_GCDS} GCDs under GL4, during each <StatusLink {...STATUSES.RIDDLE_OF_FIRE} /> window.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedGcds,
			why: <Trans id="mnk.rof.suggestions.gcd.why">
				<Plural value={droppedGcds} one="# possible GCD was" other="# possible GCDs were" /> missed during <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.ELIXIR_FIELD.icon,
			content: <Trans id="mnk.rof.suggestions.ogcd.content">
				Aim to use 1 <ActionLink {...ACTIONS.ELIXIR_FIELD} /> and at least 1 <ActionLink {...ACTIONS.SHOULDER_TACKLE} /> during each <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedExpectedOgcds,
			why: <Trans id="mnk.rof.suggestions.ogcd.why">
				<Plural value={droppedExpectedOgcds} one="# expected oGCD was" other="# expected oGCDs were" /> dropped
				during <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SHOULDER_TACKLE.icon,
			content: <Trans id="mnk.rof.suggestions.tackle.content">
				Try to use both charges of <ActionLink {...ACTIONS.SHOULDER_TACKLE} /> during <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />,
				unless you need to hold a charge for strategic purposes.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,	// Always a minor suggestion
			},
			value: riddlesWithOneTackle,
			why: <Trans id="mnk.rof.suggestions.tackle.why">
				<Plural value={riddlesWithOneTackle} one="# use" other="# uses" /> of <StatusLink {...STATUSES.RIDDLE_OF_FIRE} /> contained
				only one use of <ActionLink {...ACTIONS.SHOULDER_TACKLE} />.
			</Trans>,
		}))
	}

	private stopAndSave(endTime: number = this.parser.currentTimestamp): void {
		if (this.riddle?.active) {
			// Check for any GCDs spent outside of Fists of Wind
			// If the first RoF GCD is out of FoW (should be Snap/Demo/RB), they'll lose 1 GCD so we set 10
			// If more than 1 GCD is out of FoW, they'll lose 2 so we set 9
			const windlessGcds = this.riddle.gcdsByFist(FISTLESS) +
				this.riddle.gcdsByFist(STATUSES.FISTS_OF_EARTH.id) +
				this.riddle.gcdsByFist(STATUSES.FISTS_OF_FIRE.id)

			if (windlessGcds > 0) {
				this.riddle.expectedGcds = EXPECTED_GCDS - Math.min(2, windlessGcds)
			}

			this.riddle.active = false
			this.riddle.end = endTime

			this.history.push(this.riddle)
		}
	}

	output() {
		const unknownFist = this.history.reduce((total, riddle) => total + riddle.gcds - riddle.gcdsByFist(FISTLESS), 0) === 0

		return <>
			{unknownFist && (
				<Message warning icon>
					<Icon name="warning sign" />
					<Message.Content>
						<Trans id="mnk.rof.table.unknownfist">
							No Fist transition was detected over the fight. The expected number of GCDs in each <StatusLink {...STATUSES.RIDDLE_OF_FIRE} /> window is most likely inaccurate.
						</Trans>
					</Message.Content>
				</Message>
			)}

			<RotationTable
				targets={[
					{
						header: <Trans id="mnk.rof.table.header.gcds">GCDs</Trans>,
						accessor: 'gcds',
					},
					{
						header: <ActionLink showName={false} {...ACTIONS.ELIXIR_FIELD}/>,
						accessor: 'elixirField',
					},
					{
						header: <ActionLink showName={false} {...ACTIONS.SHOULDER_TACKLE}/>,
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
								actual: riddle.gcds,
								expected: riddle.expectedGcds,
							},
							elixirField: {
								actual: riddle.elixirFields,
								expected: EXPECTED_ELIXIR_FIELDS,
							},
							shoulderTackle: {
								actual: riddle.tackles,
								expected: EXPECTED_SHOULDER_TACKLES,
							},
						},
						rotation: riddle.casts,
					}))
				}
				onGoto={this.timeline.show}
			/>
		</>
	}
}
