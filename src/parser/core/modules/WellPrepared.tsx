import {Trans} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {StatusRoot} from 'data/STATUSES'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'

/**
 * Give a use time of 6m between each potion use.
 * The best way to optimize potion use is to line it up with the 6 minute burst window.
 */
const TIME_BETWEEN_POTIONS_IN_MS = 360000

// We don't want to mark fail ever
const TARGET_SEVERITIES = {
	100: TARGET.SUCCESS,
	0: TARGET.WARN,
}

export class WellPrepared extends Analyser {
	static override handle = 'wellprepared'

	@dependency protected checklist!: Checklist
	@dependency protected data!: Data
	@dependency private statuses!: Statuses
	@dependency private actors!: Actors

	private wellFed: StatusRoot['WELL_FED'] = this.data.statuses.WELL_FED
	private medicated: StatusRoot['MEDICATED'] = this.data.statuses.MEDICATED
	private potionUses: number = 0

	override initialise() {
		this.addEventHook(filter<Event>().type('statusApply').source(this.parser.actor.id)
			.status(this.medicated.id)
			.target(this.parser.actor.id), this.onPotionUse)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		this.checklist.add(new TieredRule({
			name: <Trans id="core.wellprepared.checklist.name">
				Well prepared
			</Trans>,
			description: <Trans id="core.wellprepared.checklist.description">
				Always be ready to go into combat with high quality food and potions. These are easy sources of extra potency.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="core.wellprepared.checklist.requirements.wellfed.name">
						<StatusLink id={this.wellFed.id}/> uptime
					</Trans>,
					percent: this.getWellFedUptimePercent(),
				}),
				new Requirement({
					name: <StatusLink id={this.medicated.id}/>,
					value: this.potionUses,
					target: this.getMaxPotionUses(),
				}),
			],
			tiers: TARGET_SEVERITIES,
		}))
	}

	private getMaxPotionUses(): number {
		// We use `Math.ceil` to account for the first potion
		return Math.ceil(this.parser.pull.duration / TIME_BETWEEN_POTIONS_IN_MS)
	}

	private getWellFedUptimePercent(): number {
		const statusUptime = this.statuses.getUptime(this.wellFed, this.actors.current)
		const fightUptime = this.parser.currentDuration

		return (statusUptime / fightUptime) * 100
	}

	private onPotionUse() {
		this.potionUses += 1
	}
}
