import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React from 'react'

const SOULSOW_CAST_TIME = 5000 //milliseconds
const SOULSOW_CAST_GRACE = 1000
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
	@dependency private unableToAct!: UnableToAct

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

	private getValidatedInvulnWindows() {
		const ADJUSTED_CAST = SOULSOW_CAST_TIME + SOULSOW_CAST_GRACE
		const invulnWindows = this.invulnerability.getWindows().filter((w) => { return w.end - w.start >=  ADJUSTED_CAST })
		//only filter windows if there was any time at all during the fight where players cannot act
		if (this.unableToAct.getDuration() > 0) {
			return invulnWindows.filter((w) => {
				const firstWindow = this.unableToAct.getWindows({start: w.start, end: w.end})[0]
				return firstWindow == null ? false : (firstWindow.start - w.start >= ADJUSTED_CAST) || (w.end - firstWindow.end >= ADJUSTED_CAST)
			})
		}
		return invulnWindows
	}

	private onComplete() {
		// expected uses is the total number of invuln windows longer than 5 seconds plus 1 for pre-pull soulsow
		const expectedUses = this.getValidatedInvulnWindows().length + 1
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
