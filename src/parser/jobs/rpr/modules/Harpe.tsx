import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {Statistics, SimpleStatistic} from 'parser/core/modules/Statistics'
import React from 'react'

const HARPE_CDR = 5000 //Harpe cast under Enhanced Harpe status reduced recast of Ingress/Engress by 5s
export class Harpe extends CoreProcs {
	static override handle = 'harpe'
	@dependency private cooldowns!: Cooldowns
	@dependency statistics!: Statistics

	override showProcTimelineRow = false

	harpesCast = 0

	override initialise(): void {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.HARPE.id),
			this.checkHarpeCast,
		)
	}

	trackedProcs = [
		{
			procStatus: this.data.statuses.ENHANCED_HARPE,
			consumeActions: [this.data.actions.HARPE],
		},

	]

	private checkHarpeCast(event: Events['action']): void {
		this.harpesCast++
		if (super.checkEventWasProc(event)) {
			this.cooldowns.reduce('HELLS_INGRESS', HARPE_CDR) //They share a CD, does not matter which one we reduce
		}
	}

	protected override addJobSpecificSuggestions(): void {
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="rpr.harpe.statistic.title">
				Harpe Casts
			</Trans>,
			icon: this.data.actions.HARPE.icon,
			value: `${this.harpesCast}`,
			info: <Trans id="rpr.harpe.statistic.info">
				While it is important to keep your GCD rolling as much as possible,
				try to minimize your <ActionLink {...ACTIONS.HARPE}/> usage. It does less damage than your other disenage options, <ActionLink {...ACTIONS.PERFECTIO}/> and <ActionLink {...ACTIONS.HARVEST_MOON}/>.
			</Trans>,
		}))
	}

}
