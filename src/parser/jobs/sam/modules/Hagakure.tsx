import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

export class Hagakure extends Analyser {
	static override handle = 'hagakure'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private hagakureCounter: number = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.HAGAKURE.id), this.onHagakure)
		this.addEventHook('complete', this.onComplete)
	}

	private onHagakure(): void {
		this.hagakureCounter++
	}

	private onComplete() {
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="sam.hagakure.statistic.title">
				Hagakure Usage
			</Trans>,
			icon: this.data.actions.HAGAKURE.icon,
			value: `${this.hagakureCounter}`,
			info: <Trans id="sam.hagakure.statistic.info">
				The 7.05 changes to <DataLink action="TSUBAME_GAESHI"/> have made it replace <DataLink action="HAGAKURE"/> for filler management. You should only be using <DataLink action="HAGAKURE"/> during downtime to realign if needed.
				For more infomation on the rotation loop, please see the linked infographic in the Non-Standard Sen Windows section below or visit The Balance.
			</Trans>,
		}))

	}
}
