import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import React from 'react'

const SOULSOW_CAST_TIME = 5000 //milliseconds
const USAGE_PERCENTAGE_SEVERITY = {
	5: TARGET.FAIL,
	10: TARGET.WARN,
	100: TARGET.SUCCESS,
}

export class HarvestMoon extends Analyser {
	static override handle = 'HarvestMoon'

	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability

	private harvestMoonCasts = 0

	override initialise() {
		super.initialise()

		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action')
			.action(this.data.actions.HARVEST_MOON.id), this.onHarvestMoon)
		this.addEventHook('complete', this.onComplete)
	}

	private onHarvestMoon() {
		this.harvestMoonCasts++
	}

	private onComplete() {
		// expected uses is the total number of invuln windows longer than 5 seconds plus 1 for pre-pull soulsow
		const expectedUses = this.invulnerability.getWindows().filter((w) => { return w.end - w.start >= SOULSOW_CAST_TIME }).length + 1
		const hmUsesPercent = (this.harvestMoonCasts / expectedUses * 100).toFixed(2)
		this.checklist.add(new TieredRule({
			name: <Trans id="rpr.harvest-moon.checklist.title">
				Use <DataLink action="SOULSOW" /> during downtime.
			</Trans>,
			description: <Trans id="rpr.harvest-moon.checklist.description">
				Harvest Moon is one of your highest potency abilities.
				Aim to get at least one use each time the boss is targetable.
			</Trans>,
			tiers: USAGE_PERCENTAGE_SEVERITY,
			requirements: [
				new Requirement({
					name: <Trans id="rpr.harvestmoon.checklist.requirement.name">
						<DataLink action="HARVEST_MOON" /> uses
					</Trans>,
					overrideDisplay: `${this.harvestMoonCasts} / ${expectedUses} (${hmUsesPercent}%)`,
					percent: hmUsesPercent,
				}),
			],
		}))
	}
}
