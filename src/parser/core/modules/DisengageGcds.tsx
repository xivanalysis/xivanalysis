import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React, {ReactNode} from 'react'

export abstract class DisengageGcds extends Analyser {
	static override handle = 'disengagegcds'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private disengageGcds: number = 0

	// Required: Override with the GCD you want to track as an Action.
	protected abstract disengageAction: Action = this.data.actions.UNKNOWN

	// Recommended: Override this to provide the action's icon, eg for gunbreaker:
	// override disengageIcon = this.data.actions.LIGHTNING_SHOT.icon
	protected disengageIcon: string = this.data.actions.UNKNOWN.icon

	// Optional: Override to provide job-specific title and info text for this statistic
	protected disengageTitle: ReactNode = <Trans id="core.disengage.statistic.title">Ranged Attack Uses</Trans>
	protected disengageInfo: ReactNode = <Trans id="core.disengage.statistic.info">While it is important to keep your GCD rolling as much as possible, try to minimize using ranged attacks that do less damage and delay resource generation.</Trans>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.disengageAction.id), this.onUse)
		this.addEventHook('complete', this.addDisengageStatistic)
	}

	protected addDisengageStatistic() {

		this.statistics.add(new SimpleStatistic({
			title: this.disengageTitle,
			icon: this.disengageIcon,
			info: this.disengageInfo,
			value: `${this.disengageGcds}`,
		}))
	}

	private onUse(): void {
		this.disengageGcds++
	}

}
