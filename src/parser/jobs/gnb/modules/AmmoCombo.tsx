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
import {Timeline} from 'parser/core/modules/Timeline'

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
	TOTAL_SKILLS_PER_COMBO: 6,
}

class GnashingComboState {
	startTime: number
	endTime?: number
	rotation: CastEvent[] = []
	isProper: boolean = false

	constructor(start: number) {
		this.startTime = start
	}

	public get totalHits(): number {return this.rotation.length}

	public get actualJug() : number {
		return this.rotation.filter(cast => cast.ability.guid === ACTIONS.JUGULAR_RIP.id).length
	}

	public get actualSavage(): number {
		return this.rotation.filter(cast => cast.ability.guid === ACTIONS.SAVAGE_CLAW.id).length
	}

	public get actualTear(): number {
		return this.rotation.filter(cast => cast.ability.guid === ACTIONS.ABDOMEN_TEAR.id).length
	}

	public get actualTalon(): number {
		return this.rotation.filter(cast => cast.ability.guid === ACTIONS.WICKED_TALON.id).length
	}

	public get actualEye(): number {
		return this.rotation.filter(cast => cast.ability.guid === ACTIONS.EYE_GOUGE.id).length
	}
}

export default class AmmoCombo extends Module {
	static handle = 'Gnashing Fang Combo issues'
	static debug = false

	@dependency private checklist!: Checklist
	@dependency private timeline!: Timeline

	private buffs = 0
	private actions = 0
	private errors = 0

	private gnashingComboWindows: GnashingComboState[] = [] // Store all the gnashing fang combos to be output to the rotationTable

	private get lastGnashingCombo(): GnashingComboState | undefined {
		return _.last(this.gnashingComboWindows)
	}


	protected init() {
		this.addEventHook('cast',
			{
				by: 'player',
				abilityId: RELEVANT_ACTIONS,
			},
			() => this.actions++)

		this.addEventHook('cast', {by: 'player'}, this.onCast)

		this.addEventHook('applybuff',
			{
				by: 'player',
				abilityId: RELEVANT_STATUSES,
			},
			() => this.buffs++)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {

		const actionId = event.ability.guid

		// cases to ignore, No Mercy any other modules will handle the latter 2 and FUCK sprint.

		if (actionId === ACTIONS.ATTACK.id || actionId === ACTIONS.SPRINT.id || actionId === ACTIONS.BURST_STRIKE.id || actionId === ACTIONS.SONIC_BREAK.id ) {
			return
		}

		let lastGnashingCombo = this.lastGnashingCombo

		this.debug(`Checking if action ${event.ability.name} (${actionId}) is a Gnashing Fang action`)

		if (actionId === ACTIONS.GNASHING_FANG.id) {

		this.debug(`Action ${event.ability.name} (${actionId}) is a Gnashing Fang action`)

			if (lastGnashingCombo != null && lastGnashingCombo.endTime == null) { // They dropped the combo via timeout
				this.onEndGnashingCombo(event)
			}

			const gnashingComboState = new GnashingComboState(event.timestamp)
			this.gnashingComboWindows.push(gnashingComboState)
		}

		if (COMBO_BREAKERS.includes(actionId) ) {

			this.onEndGnashingCombo(event)
		}

		// If the action is a gnashingCombo one, log it

		lastGnashingCombo = this.lastGnashingCombo

		if (lastGnashingCombo != null && lastGnashingCombo.endTime == null) {

			if (COMBO_ACTIONS.includes(actionId) ) {
				lastGnashingCombo.rotation.push(event)

				if (actionId === ACTIONS.EYE_GOUGE.id) {
					this.onEndGnashingCombo(event)
				}
			}

		}
	}

	private onEndGnashingCombo(event: CastEvent) {

		const lastGnashingCombo = this.lastGnashingCombo

		if (lastGnashingCombo != null) {

			lastGnashingCombo.endTime = event.timestamp

			if (lastGnashingCombo.totalHits === EXPECTED_USES.TOTAL_SKILLS_PER_COMBO) {
				lastGnashingCombo.isProper = true
			}

			if (lastGnashingCombo.isProper === false) {
				this.errors++
			}
		}
	}

	private onComplete() {

		const lastGnashingCombo = this.lastGnashingCombo

		if (lastGnashingCombo != null && lastGnashingCombo.endTime == null) {

			lastGnashingCombo.endTime = this.parser.currentTimestamp
		}

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

		if (this.errors !== 0) {

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
							start: window.startTime - this.parser.fight.start_time,
							end: window.endTime != null ? window.endTime - this.parser.fight.start_time : window.startTime - this.parser.fight.start_time,
							targetsData: {
								jugularRip: {
									actual: window.actualJug,
									expected: EXPECTED_USES.JUGULAR_RIP,
								},
								savageClaw: {
									actual: window.actualSavage,
									expected: EXPECTED_USES.SAVAGE_CLAW,
								},
								abdomenTear: {
									actual: window.actualTear,
									expected: EXPECTED_USES.ABDOMEN_TEAR,
								},
								wickedTalon: {
									actual: window.actualTalon,
									expected: EXPECTED_USES.WICKED_TALON,
								},
								eyeGouge: {
									actual: window.actualEye,
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
}
