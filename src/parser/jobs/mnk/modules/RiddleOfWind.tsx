import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

/**
 * While it is possible to get 16 attacks in a Riddle of Wind window,
 * it's such a niche and time based thing that it's not worth handling.
 * Even in a lot of top parsing monk logs, it's effectively RNG if they get 16.
 */
const EXPECTED_ATTACKS_PER_ROW_WINDOW = 15

export class RiddleOfWind extends Analyser {
	static override handle = 'riddleofwind'

	@dependency data!: Data
	@dependency statistics!: Statistics

	private history: number[] = []
	private autos: number = 0

	private windHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.RIDDLE_OF_WIND.id), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.RIDDLE_OF_WIND.id), this.onPass)

		this.addEventHook('complete', this.onComplete)
	}

	private onGain(): void {
		if (this.windHook == null) {
			this.windHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action')
					.action(this.data.actions.ATTACK.id),
				() => this.autos++
			)
		}
	}

	// Passing Wind, get it
	private onPass(): void {
		if (this.windHook != null) {
			// Cleanup data
			this.history.push(this.autos)
			this.autos = 0

			// Cleanup hooks
			this.removeEventHook(this.windHook)
			this.windHook = undefined
		}
	}

	private onComplete() {
		// We default to 15 per window, but for any windows that got 16 we add an extra 1
		const expectedAttacks = this.history.length
			* EXPECTED_ATTACKS_PER_ROW_WINDOW
			+ this.history.filter(autos => autos >= EXPECTED_ATTACKS_PER_ROW_WINDOW + 1).length

		const actualAttacks = this.history.reduce((total, autos) => total + autos, 0)

		this.statistics.add(new SimpleStatistic({
			title: <Trans id="mnk.row.statistic.title">
				Auto Attacks Hits
			</Trans>,
			icon: this.data.actions.RIDDLE_OF_WIND.icon,
			value: `${actualAttacks}/${expectedAttacks}`,
			info: <Trans id="mnk.row.statistic.info">
				Missing auto attacks during <ActionLink action="RIDDLE_OF_WIND"/> means you were not
				able get full uptime on the boss. This is a DPS loss due to missing auto attacks.
			</Trans>,
		}))
	}
}
