import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React from 'react'

const SOULSOW_BUFFER = 1000

export class HarvestMoon extends Analyser {
	static override handle = 'harvestMoon'

	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private unableToAct!: UnableToAct

	private harvestMoonCasts = 0

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.HARVEST_MOON.id),
			() => this.harvestMoonCasts++)

		this.addEventHook('complete', this.onComplete)
	}

	private canChargeMoon(inputWindow: {start: number, end: number}): boolean {
		const ADJUSTED_CAST_TIME = this.data.actions.SOULSOW.castTime + SOULSOW_BUFFER

		// get the earliest unable to act window that falls within the provided inputWindow
		const unableToActWindow = this.unableToAct.getWindows(inputWindow)[0]

		// the window will be undefined if there are no unable to act windows left before the end of the inputWindow
		if (unableToActWindow == null) {
			// True if there are ADJUSTED_CAST_TIME milliseconds or more remaining in the inputWindow
			return inputWindow.end - inputWindow.start >= ADJUSTED_CAST_TIME
		}

		// return true if there are ADJUSTED_CAST_TIME milliseconds between the beginning of the window being checked and the beginning of an unableToAct window
		if (unableToActWindow.start - inputWindow.start >= ADJUSTED_CAST_TIME) {
			return true
		}

		// recurse the method, shrinking the window to the space between the end of the unable to act window and the end of the input window.
		return this.canChargeMoon({start: unableToActWindow.end, end: inputWindow.end})
	}

	private getExpectedUses(): number {
		const ADJUSTED_CAST = this.data.actions.SOULSOW.castTime + SOULSOW_BUFFER
		const invulnWindows = this.invulnerability.getWindows().filter((window) => window.end - window.start >=  ADJUSTED_CAST)

		// will only run the window filter if there is a non-zero amount of unableToAct time during the fight.
		if (this.unableToAct.getDuration({start: this.parser.pull.timestamp, end: this.parser.pull.timestamp + this.parser.pull.duration}) > 0) {
			return invulnWindows.filter(window => this.canChargeMoon(window)).length + 1
		}

		return invulnWindows.length + 1
	}

	private getUsedPercentage(expectedUses: number): string {
		return (this.harvestMoonCasts / expectedUses * 100).toFixed(2)
	}

	private onComplete() {
		const expectedUses = this.getExpectedUses()
		const hmUsesPercent = this.getUsedPercentage(expectedUses)

		this.checklist.add(new Rule({
			name: <Trans id="rpr.harvestmoon.checklist.title">
				Use <DataLink action="SOULSOW" /> during downtime.
			</Trans>,
			description: <Trans id="rpr.harvestmoon.checklist.description">
				Harvest Moon is one of your highest potency abilities. Aim to get at least one use each time the boss is targetable.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="rpr.harvestmoon.checklist.requirement.name">
						<DataLink action="HARVEST_MOON" /> uses
					</Trans>,
					overrideDisplay: `${this.harvestMoonCasts} / ${expectedUses} (${hmUsesPercent}%)`,
					percent: hmUsesPercent,
				}),
			],
			target: 100,
		}))
	}
}
