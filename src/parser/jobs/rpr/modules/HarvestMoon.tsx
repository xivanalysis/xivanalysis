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
			() => { this.harvestMoonCasts++ })

		this.addEventHook('complete', this.onComplete)
	}

	private getExpectedUses(): number {
		const ADJUSTED_CAST = this.data.actions.SOULSOW.castTime + BUFFER
		const invulnWindows = this.invulnerability.getWindows().filter((w) => { return w.end - w.start >=  ADJUSTED_CAST })

		if (this.unableToAct.getDuration() > 0) {
			return invulnWindows.filter((w) => {
				const firstWindow = this.unableToAct.getWindows({start: w.start, end: w.end})[0]

				return firstWindow == null ? false : w.start - firstWindow.start >= ADJUSTED_CAST || firstWindow.end - w.end >= ADJUSTED_CAST
			}).length + 1
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
				Harvest Moon is one of your highest potency abilities.
				Aim to get at least one use each time the boss is targetable.
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
