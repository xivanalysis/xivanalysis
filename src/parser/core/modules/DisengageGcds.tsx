import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

export class DisengageGcds extends Analyser {
	static override handle = 'disengagegcds'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private disengageGcds: number = 0

	// Pass in the GCD you want to track as an Action.
	protected trackedAction: Action = this.data.actions.UNKNOWN

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.trackedAction.id), this.onUse)
		this.addEventHook('complete', this.onComplete)
	}

	// Override this to suggest job-specific ways to handle downtime
	protected addDisengageSuggestion() {
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="core.disengage.statistic.title">
				{this.trackedAction.name} Uses
			</Trans>,
			icon: this.trackedAction.icon,
			value: `${this.disengageGcds}`,
			info: <Trans id="core.disengage.statistic.info">
				While it is important to keep your GCD rolling as much as possible,
				try to minimize your <ActionLink {...this.trackedAction}/> usage. It does less damage and delays resource generation.
			</Trans>,
		}))
	}

	private onUse(): void {
		this.disengageGcds++
	}

	private onComplete() {
		this.addDisengageSuggestion()
	}
}
