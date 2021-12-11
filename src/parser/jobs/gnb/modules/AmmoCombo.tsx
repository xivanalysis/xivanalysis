import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'

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
	rotation: Array<Events['action']>
	isProper: boolean = false

	constructor(start: number) {
		this.startTime = start
		this.rotation = []
	}

	public get totalHits(): number { return this.rotation.length }

	public get actualJug() : number {
		return this.rotation.filter(event => event.action === ACTIONS.JUGULAR_RIP.id).length
	}

	public get actualSavage(): number {
		return this.rotation.filter(event => event.action === ACTIONS.SAVAGE_CLAW.id).length
	}

	public get actualTear(): number {
		return this.rotation.filter(event => event.action === ACTIONS.ABDOMEN_TEAR.id).length
	}

	public get actualTalon(): number {
		return this.rotation.filter(event => event.action === ACTIONS.WICKED_TALON.id).length
	}

	public get actualEye(): number {
		return this.rotation.filter(event => event.action === ACTIONS.EYE_GOUGE.id).length
	}
}

export default class AmmoCombo extends Analyser {
	static override handle = 'Gnashing Fang Combo issues'
	static override debug = false

	@dependency private checklist!: Checklist
	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private buffs = 0
	private actions = 0
	private errors = 0

	private COMBO_BREAKERS = [this.data.actions.KEEN_EDGE.id, this.data.actions.BRUTAL_SHELL.id, this.data.actions.SOLID_BARREL.id] // These skills will break the Gnashing combo
	private COMBO_ACTIONS = [this.data.actions.GNASHING_FANG.id, this.data.actions.JUGULAR_RIP.id, this.data.actions.SAVAGE_CLAW.id, this.data.actions.ABDOMEN_TEAR.id, this.data.actions.WICKED_TALON.id, ACTIONS.EYE_GOUGE.id]

	private gnashingComboWindows: GnashingComboState[] = [] // Store all the gnashing fang combos to be output to the rotationTable

	private get lastGnashingCombo(): GnashingComboState | undefined {
		return _.last(this.gnashingComboWindows)
	}

	override initialise() {
		super.initialise()

		const RELEVANT_ACTIONS = [this.data.actions.JUGULAR_RIP.id, this.data.actions.ABDOMEN_TEAR.id, this.data.actions.EYE_GOUGE.id]
		const RELEVANT_STATUSES = [this.data.statuses.READY_TO_TEAR.id, this.data.statuses.READY_TO_TEAR.id, this.data.statuses.READY_TO_GOUGE.id]

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(oneOf(RELEVANT_STATUSES)), () => this.buffs++)
		this.addEventHook(playerFilter.type('action').action(oneOf(RELEVANT_ACTIONS)), () => this.actions++)

		this.addEventHook('complete', this.onComplete)
	}
	onCast(event: Events['action']): void {

		const action = this.data.getAction(event.action)

		if (action) { //If it ain't defined I don't want it

			// If ain't a combo or a breaker IDGAF
			if (!this.COMBO_ACTIONS.includes(action.id)  || (!this.COMBO_BREAKERS.includes(action.id))) {
				return
			}

			let lastGnashingCombo = this.lastGnashingCombo

			this.debug(`Checking if action ${action?.name} (${action}) is a Gnashing Fang action`)

			if (action === this.data.actions.GNASHING_FANG) {

				this.debug(`Action ${action?.name} (${action}) is a Gnashing Fang action`)

				if (lastGnashingCombo != null && lastGnashingCombo.endTime == null) { // They dropped the combo via timeout
					this.onEndGnashingCombo(event)
				}

				const gnashingComboState = new GnashingComboState(event.timestamp)
				this.gnashingComboWindows.push(gnashingComboState)
			}

			if (this.COMBO_BREAKERS.includes(action.id)) {

				this.onEndGnashingCombo(event)
			}

			// If the action is a gnashingCombo one, log it

			lastGnashingCombo = this.lastGnashingCombo

			if (lastGnashingCombo != null && lastGnashingCombo.endTime == null) {

				if (this.COMBO_ACTIONS.includes(action.id)) {
					lastGnashingCombo.rotation.push(event)

					if (action === this.data.actions.EYE_GOUGE) {
						this.onEndGnashingCombo(event)
					}
				}

			}
		}
	}

	private onEndGnashingCombo(event: Events['action']) {

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

			lastGnashingCombo.endTime = this.parser.currentEpochTimestamp
		}

		this.checklist.add(new Rule({
			name: 'Use a Continuation once per single-target ammo action',
			description: <Trans id="gnb.continuation.checklist.description">
				One <ActionLink {...ACTIONS.CONTINUATION}/> action should be used for each single-target ammo skill
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

	override output() {

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
							start: window.startTime - this.parser.pull.timestamp,
							end: window.endTime != null ? window.endTime - this.parser.pull.timestamp : window.startTime - this.parser.pull.timestamp,
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
