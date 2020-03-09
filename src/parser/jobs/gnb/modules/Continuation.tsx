import {Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Timeline from 'parser/core/modules/Timeline'

const RELEVANT_ACTIONS = [ACTIONS.JUGULAR_RIP.id, ACTIONS.ABDOMEN_TEAR.id, ACTIONS.EYE_GOUGE.id]
const RELEVANT_STATUSES = [STATUSES.READY_TO_RIP.id, STATUSES.READY_TO_TEAR.id, STATUSES.READY_TO_GOUGE.id]
const COMBO_BREAKERS = [ACTIONS.KEEN_EDGE.id, ACTIONS.BRUTAL_SHELL.id, ACTIONS.SOLID_BARREL.id] // These skills will break the Gnashing combo
const COMBO_ACTIONS = [ACTIONS.GNASHING_FANG.id, ACTIONS.JUGULAR_RIP.id, ACTIONS.SAVAGE_CLAW.id, ACTIONS.ABDOMEN_TEAR.id, ACTIONS.WICKED_TALON.id, ACTIONS.EYE_GOUGE.id]

// Expected within a standard gnashing.
const EXPECTED_USES = {
	JUGULAR_RIP: 1,
	SAVAGE_CLAW: 1,
	ABDOMEN_TEAR: 1,
	WICKED_TALON: 1,
	EYE_GOUGE: 1,
}

const GNASHING_TIME = 7500 // time in ms, this is the "fastest" time a combo can happen, but can take longer TODO: Dropped Combos?

class GnashingComboState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	isRushing: boolean = false
	isProper: boolean = false

	// the trackers
	numGnashing: number = 0
	numJugular: number = 0
	numSavage: number = 0
	numAbdomen: number = 0
	numWicked: number = 0
	numEye: number = 0
	numTotal: number = 0 // This is the filter, sub 6 = possible problem

	constructor(start: number) {
		this.start = start
	}
}

export default class Continuation extends Module {
	static handle = 'Gnashing Fang'

	@dependency private checklist!: Checklist
	@dependency private timeline!: Timeline

	private buffs = 0
	private actions = 0

	private gnashingComboWindows: GnashingComboState[] = [] // Store all the gnashing fang combos to be output to the rotationTable

	private get lastGnashingCombo(): GnashingComboState | undefined {
		return _.last(this.gnashingComboWindows)
	}

	protected init() { // TODO: Strip away the other hooks? I could roll them into the actual cast I have for tracking the combo, but won't be as nice looking IMO
		this.addHook('cast',
			{
				by: 'player',
				abilityId: RELEVANT_ACTIONS,
			},
			() => this.actions++)

		this.addHook('cast', {by: 'player'}, this.onCast)

		this.addHook('applybuff',
			{
				by: 'player',
				abilityId: RELEVANT_STATUSES,
			},
			() => this.buffs++)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		// cases to ignore, No Mercy any other modules will handle the latter 2.
		if (actionId === ACTIONS.ATTACK.id || actionId === ACTIONS.BURST_STRIKE.id || actionId === ACTIONS.SONIC_BREAK.id ) {
			return
		}

		if (actionId === ACTIONS.GNASHING_FANG.id) {
			const gnashingComboState = new GnashingComboState(event.timestamp)
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			gnashingComboState.isRushing = GNASHING_TIME >= fightTimeRemaining

			this.gnashingComboWindows.push(gnashingComboState)
		}

		if (COMBO_BREAKERS.hasOwnProperty(actionId) ) {
			this.onEndGnashingCombo(event)
		}

		// If the action is a gnashing one, log it

		const lastGnashingCombo = this.lastGnashingCombo
		if (lastGnashingCombo != null && lastGnashingCombo.end == null) {

				switch (actionId) {
					case ACTIONS.GNASHING_FANG.id:
						lastGnashingCombo.numGnashing++
						lastGnashingCombo.rotation.push(event)
						lastGnashingCombo.numTotal++
						break
					case ACTIONS.JUGULAR_RIP.id:
						lastGnashingCombo.numJugular++
						lastGnashingCombo.rotation.push(event)
						lastGnashingCombo.numTotal++
						break
					case ACTIONS.SAVAGE_CLAW.id:
						lastGnashingCombo.numSavage++
						lastGnashingCombo.rotation.push(event)
						lastGnashingCombo.numTotal++
						break
					case ACTIONS.ABDOMEN_TEAR.id:
						lastGnashingCombo.numAbdomen++
						lastGnashingCombo.rotation.push(event)
						lastGnashingCombo.numTotal++
						break
					case ACTIONS.WICKED_TALON.id:
						lastGnashingCombo.numWicked++
						lastGnashingCombo.rotation.push(event)
						lastGnashingCombo.numTotal++
						break
					case ACTIONS.EYE_GOUGE.id:
						lastGnashingCombo.numEye++
						lastGnashingCombo.numTotal++

						if (lastGnashingCombo.numTotal === 6) {
							lastGnashingCombo.isProper = true
						}

						lastGnashingCombo.rotation.push(event)
						this.onEndGnashingCombo(event)
						break
				}

				}
		 }

	private onEndGnashingCombo(event: CastEvent) {
		const lastGnashingCombo = this.lastGnashingCombo

		if (lastGnashingCombo != null) {
                        lastGnashingCombo.end = event.timestamp
		}

	}

	private onComplete() {

		this.checklist.add(new Rule({
			name: 'Use a Continuation once per action in the Gnashing Fang combo',
			description: <Trans id="gnb.continuation.checklist.description">
				One <ActionLink {...ACTIONS.CONTINUATION}/> action should be used for each <ActionLink {...ACTIONS.GNASHING_FANG}/> combo action.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="gnb.continuation.checklist.requirement.continuation.name">
						<ActionLink {...ACTIONS.CONTINUATION}/> uses per <ActionLink {...ACTIONS.GNASHING_FANG}/> combo action
					</Trans>,
					value: this.actions,
					target: this.buffs,
				}),
			],
		}))
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <ActionLink showName={false} {...ACTIONS.JUGULAR_RIP}/>,
					accessor: 'jugularRip',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.SAVAGE_CLAW}/>,
					accessor: 'savageClaw',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.ABDOMEN_TEAR}/>,
					accessor: 'abdomenTear',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.WICKED_TALON}/>,
					accessor: 'wickedTalon',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.EYE_GOUGE}/>,
					accessor: 'eyeGouge',
				},
			]}
			data={this.gnashingComboWindows
				.filter(window => !window.isProper)
				.map(window => {
					return ({
						start: window.start - this.parser.fight.start_time,
						end: window.end != null ?
							window.end - this.parser.fight.start_time
							: window.start - this.parser.fight.start_time,
						targetsData: {
							jugularRip: {
								actual: window.numJugular,
								expected: EXPECTED_USES.JUGULAR_RIP,
							},
							savageClaw: {
								actual: window.numSavage,
								expected: EXPECTED_USES.SAVAGE_CLAW,
							},
							abdomenTear: {
								actual: window.numAbdomen,
								expected: EXPECTED_USES.ABDOMEN_TEAR,
							},
							wickedTalon: {
								actual: window.numWicked,
								expected: EXPECTED_USES.WICKED_TALON,
							},
							eyeGouge: {
								actual: window.numEye,
								expected: EXPECTED_USES.EYE_GOUGE,
							},
						},
						rotation: window.rotation,
					})
				})
			}
			onGoto={this.timeline.show}
		/>
	}

}
