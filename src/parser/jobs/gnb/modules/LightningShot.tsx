import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

export class LightningShot extends Analyser {
	static override handle = 'lightningshot'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private shotsFired: number = 0

	private windHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.LIGHTNING_SHOT.id), this.onShot)
		this.addEventHook('complete', this.onComplete)
	}

	private onShot(): void {
		this.shotsFired++
	}

	private onComplete() {
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="gnb.lightningshot.statistic.title">
				Lightning Shots
			</Trans>,
			icon: this.data.actions.LIGHTNING_SHOT.icon,
			value: `${this.shotsFired}`,
			info: <Trans id="gnb.lightningshot.statistic.info">
				While it is important to keep your GCD rolling as much as possible,
				try to minimize your <ActionLink {...ACTIONS.LIGHTNING_SHOT}/> usage. It does less damaage and delays resource generation.
			</Trans>,
		}))

	}
}
