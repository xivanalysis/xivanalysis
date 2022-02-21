import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionRoot} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

/**
 * While it is possible to get 16 attacks in a Riddle of Wind
 * window, it is such a niche and time based thing that I'm
 * not sure if it's worth it. I've looked into a lot of top
 * parsing monk logs, and it almost feels like it's RNG if
 * someone has a 16 RoW attack window.
 */
const MAX_ATTACKS_PER_ROW_WINDOW = 15

class CallbackEvaluator implements WindowEvaluator {
	private readonly callback: (windows: Array<HistoryEntry<EvaluatedAction[]>>) => void;

	constructor(callback: (windows: Array<HistoryEntry<EvaluatedAction[]>>) => void) {
		this.callback = callback
	}

	output(): undefined {
		return undefined
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): undefined {
		this.callback(windows)
		return undefined
	}
}

export class RiddleOfWind extends BuffWindow {
	static override handle = 'riddleofwind'
	static override title = t('mnk.row.title')`Riddle of Wind`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_WIND

	@dependency globalCooldown!: GlobalCooldown
	@dependency statistics!: Statistics

	private riddleOfWind: ActionRoot['RIDDLE_OF_WIND'] = this.data.actions.RIDDLE_OF_WIND
	buffStatus = this.data.statuses.RIDDLE_OF_WIND

	override initialise() {
		super.initialise()

		this.trackOnlyActions([this.data.actions.ATTACK.id])
		this.addEvaluator(new CallbackEvaluator(this.addStatistic.bind(this)))
	}

	protected override isRushedEndOfPullWindow(window: HistoryEntry<EvaluatedAction[]>): boolean {
		return super.isRushedEndOfPullWindow(window)
	}

	private addStatistic(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const maxAttacks = windows.length * MAX_ATTACKS_PER_ROW_WINDOW
		const actualAttacks = windows.map(history => history.data.length).reduce((previousValue, currentValue) => previousValue + currentValue, 0)

		this.statistics.add(new SimpleStatistic({
			title: <Trans id="mnk.row.statistic.title">
				Auto attacks hits
			</Trans>,
			icon: this.data.actions.RIDDLE_OF_WIND.icon,
			value: `${actualAttacks}/${maxAttacks}`,
			info: <Trans id="mnk.row.statistic.info">
				Missing auto attacks during <ActionLink id={this.riddleOfWind.id}/> means you were not
				able get full uptime on the boss. This is a DPS loss due to missing auto attacks.
			</Trans>,
		}))
	}

	override output(): undefined {
		// Called to get our history
		super.output()
		// Don't want to show anything from the buff window, just use the history it provides
		return undefined
	}
}
