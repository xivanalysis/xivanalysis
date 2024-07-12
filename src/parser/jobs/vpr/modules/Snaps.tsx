import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

export class Snaps extends Analyser {
	static override handle = 'snaps'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private snapsSnapped: number = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.WRITHING_SNAP.id), this.onSnap)
		this.addEventHook('complete', this.onComplete)
	}

	private onSnap(): void {
		this.snapsSnapped++
	}

	private onComplete() {
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="vpr.snaps.statistic.title">
				Writhing Snaps
			</Trans>,
			icon: this.data.actions.WRITHING_SNAP.icon,
			value: `${this.snapsSnapped}`,
			info: <Trans id="vpr.snaps.statistic.info">
				While it is important to keep your GCD rolling as much as possible,
				try to minimize your <ActionLink {...ACTIONS.WRITHING_SNAP}/> usage. It's better to save and use <ActionLink {...ACTIONS.UNCOILED_FURY}/> for when you cannot stay in melee range as it does more damage.
			</Trans>,
		}))

	}
}
