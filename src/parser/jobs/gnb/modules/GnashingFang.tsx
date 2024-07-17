import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import {Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
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

}

export class GnashingFang extends Analyser {
	static override handle = 'Gnashing Fang Combo issues'
	static override debug = false

	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private errors = 0

	private COMBO_BREAKERS = [this.data.actions.KEEN_EDGE.id, this.data.actions.BRUTAL_SHELL.id, this.data.actions.SOLID_BARREL.id, this.data.actions.LION_HEART.id, this.data.actions.NOBLE_BLOOD.id, this.data.actions.REIGN_OF_BEASTS.id] // These skills will break the Gnashing combo
	private COMBO_ACTIONS = [this.data.actions.GNASHING_FANG.id, this.data.actions.JUGULAR_RIP.id, this.data.actions.SAVAGE_CLAW.id, this.data.actions.ABDOMEN_TEAR.id, this.data.actions.WICKED_TALON.id, ACTIONS.EYE_GOUGE.id]

	private gnashingComboWindows: GnashingComboState[] = [] // Store all the gnashing fang combos to be output to the rotationTable

	private get lastGnashingCombo(): GnashingComboState | undefined {
		return _.last(this.gnashingComboWindows)
	}

	override initialise() {
		super.initialise()
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
	}

	override output() {

		if (this.errors !== 0) {

			return <RotationTable
				targets={[
					{
						header: <ActionLink showName={false} {...ACTIONS.GNASHING_FANG}/>,
						accessor: 'TotalActions',
					},
				]}
				data={this.gnashingComboWindows
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
