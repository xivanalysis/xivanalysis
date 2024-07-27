import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'

// A combo module because core combo doesn't support parallel combos... TODO: Fix core combo
const EXPECTED_USES = {
	REIGN_OF_BEASTS: 1,
	NOBLE_BLOOD: 1,
	LION_HEART: 1,
	TOTAL_SKILLS_PER_COMBO: 3,
}

class LionHeartComboState {
	startTime: number
	endTime?: number
	rotation: Array<Events['action']>
	isProper: boolean = false

	constructor(start: number) {
		this.startTime = start
		this.rotation = []
	}
	public get totalHits(): number { return this.rotation.length }

}

export class Lionheart extends Analyser {
	static override handle = 'LionHeart Combo issues'
	static override debug = false

	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private errors = 0
	private ReadyToReigns = 0

	private COMBO_BREAKERS = [this.data.actions.KEEN_EDGE.id, this.data.actions.BRUTAL_SHELL.id, this.data.actions.SOLID_BARREL.id, this.data.actions.GNASHING_FANG.id, this.data.actions.JUGULAR_RIP.id, this.data.actions.SAVAGE_CLAW.id, this.data.actions.ABDOMEN_TEAR.id, this.data.actions.WICKED_TALON.id, ACTIONS.EYE_GOUGE.id] // These skills will break the LionHeart Combo
	private COMBO_ACTIONS = [this.data.actions.LION_HEART.id, this.data.actions.NOBLE_BLOOD.id, this.data.actions.REIGN_OF_BEASTS.id]

	private lionheartComboWindows: LionHeartComboState[] = [] // Store all the LionHeart combos to be output to the rotationTable

	private get lastLionheartCombo(): LionHeartComboState | undefined {
		return _.last(this.lionheartComboWindows)
	}

	override initialise() {
		super.initialise()
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action'), this.onCast)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.READY_TO_REIGN.id), () => this.ReadyToReigns++)
		this.addEventHook('complete', this.onComplete)
	}
	onCast(event: Events['action']): void {

		const action = this.data.getAction(event.action)

		if (action) { //If it ain't defined I don't want it

			// If ain't a combo or a breaker IDGAF
			if (!this.COMBO_ACTIONS.includes(action.id)  && (!this.COMBO_BREAKERS.includes(action.id))) {
				return
			}

			let lastLionheartCombo = this.lastLionheartCombo

			this.debug(`Checking if action ${action?.name} (${action}) is a Reign of Beasts action`)

			if (action === this.data.actions.REIGN_OF_BEASTS) {

				this.debug(`Action ${action?.name} (${action}) is a Reign of Beasts action`)

				if (lastLionheartCombo != null && lastLionheartCombo.endTime == null) { // They dropped the combo via timeout
					this.onEndLionheartCombo(event)
				}

				const lionheartComboState = new LionHeartComboState(event.timestamp)
				this.lionheartComboWindows.push(lionheartComboState)
			}

			if (this.COMBO_BREAKERS.includes(action.id)) {

				this.onEndLionheartCombo(event)
			}

			// If the action is a lionheart Combo one, log it

			lastLionheartCombo = this.lastLionheartCombo

			if (lastLionheartCombo != null && lastLionheartCombo.endTime == null) {

				if (this.COMBO_ACTIONS.includes(action.id)) {
					lastLionheartCombo.rotation.push(event)

					if (action === this.data.actions.LION_HEART) {
						this.onEndLionheartCombo(event)
					}
				}

			}
		}
	}

	private onEndLionheartCombo(event: Events['action']) {

		const lastLionheartCombo = this.lastLionheartCombo

		if (lastLionheartCombo != null) {

			lastLionheartCombo.endTime = event.timestamp

			if (lastLionheartCombo.totalHits === EXPECTED_USES.TOTAL_SKILLS_PER_COMBO) {
				lastLionheartCombo.isProper = true
			}

			if (lastLionheartCombo.isProper === false) {
				this.errors++
			}
		}
	}

	private onComplete() {

		const lastLionheartCombo = this.lastLionheartCombo

		if (lastLionheartCombo != null && lastLionheartCombo.endTime == null) {

			lastLionheartCombo.endTime = this.parser.currentEpochTimestamp
		}

	}

	override output() {

		if (this.errors !== 0) {

			return <RotationTable
				targets={[
					{
						header: <ActionLink showName={false} {...ACTIONS.LION_HEART}/>,
						accessor: 'TotalActions',
					},
				]}
				data={this.lionheartComboWindows
					.filter(window => !window.isProper)
					.map(window => {
						return ({
							start: window.startTime - this.parser.pull.timestamp,
							end: window.endTime != null ? window.endTime - this.parser.pull.timestamp : window.startTime - this.parser.pull.timestamp,
							targetsData: {
								TotalActions: {
									actual: window.totalHits,
									expected: EXPECTED_USES.TOTAL_SKILLS_PER_COMBO,
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
