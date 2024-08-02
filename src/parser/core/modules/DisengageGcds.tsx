import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React, {ReactNode} from 'react'

export class DisengageGcds extends Analyser {
	static override handle = 'disengagegcds'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private disengageGcds: number = 0

	// Pass in the GCD you want to track as an Action.
	protected trackedAction: Action = this.data.actions.UNKNOWN

	// Override these to provide job specific title and text for this statistic
	protected disengageInfo: ReactNode = <Trans id="core.disengage.statistic.info">While it is important to keep your GCD rolling as much as possible, try to minimize using ranged attacks that do less damage and delay resource generation.</Trans>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.trackedAction.id), this.onUse)
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Jobs MAY override this to add additional suggestions beyond the default
	 * @param disengageGcds The number of times the tracked action was used in this pull
	 * @returns true to prevent adding the default suggestion, or false to include the default suggestions
	 */
	protected addJobSpecificStatistics(_disengageGcds: number): boolean {
		return false
	}

	// Set addJobSpecificSuggestions to true replace this output, or false to add to it
	protected addDisengageStatistic() {

		if (this.addJobSpecificStatistics(this.disengageGcds)) {
			return
		}

		this.statistics.add(new SimpleStatistic({
			title: <Trans id="core.disengage.statistic.title">
				{this.trackedAction.name} Uses
			</Trans>,
			icon: this.trackedAction.icon,
			value: `${this.disengageGcds}`,
			info: this.disengageInfo,
		}))
	}

	private onUse(): void {
		this.disengageGcds++
	}

	private onComplete() {
		this.addDisengageStatistic()
	}
}
