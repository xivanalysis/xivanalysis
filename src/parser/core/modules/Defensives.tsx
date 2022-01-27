import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import {Data} from 'parser/core/modules/Data'
import {TableStatistic, Statistics, SimpleStatistic} from 'parser/core/modules/Statistics'
import {Rows} from 'parser/core/modules/Statistics/TableStatistic'
import React from 'react'
import {AbstractStatisticOptions} from './Statistics/AbstractStatistic'

const TABLE_COLUMNS = 3

export abstract class Defensives extends Analyser {
	static override handle = 'defensives'
	static override title = t('core.defensives.title')`Defensives`

	@dependency protected cooldownDowntime!: CooldownDowntime
	@dependency protected data!: Data
	@dependency private statistics!: Statistics

	/**
	 * Implementing modules MUST provide a list of defensive actions to track
	 */
	protected abstract trackedDefensives: Action[]

	/**
	 * Implementing modules may provide opts for the statistic display
	 */
	protected statisticOpts: AbstractStatisticOptions = {}

	private uses: Map<number, number> = new Map()

	override initialise() {
		const actionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')

		this.trackedDefensives.forEach(defensive => {
			this.addEventHook(actionFilter.action(defensive.id),
				() => this.uses.set(defensive.id, (this.uses.get(defensive.id) ?? 0) + 1)
			)
		})

		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		if (this.trackedDefensives.length === 1) {
			// Only one defensive, use a simple statistic rather than a table
			const action = this.trackedDefensives[0]
			const uses = this.uses.get(action.id) ?? 0
			const maxUses = this.cooldownDowntime.calculateMaxUsages({cooldowns: [action]})

			this.statistics.add(new SimpleStatistic({
				icon: action.icon,
				title: <Trans id="core.defensives.statistic-title">
					<ActionLink showIcon={false} {...action} /> Uses
				</Trans>,
				value: <>{uses} / {maxUses} ({Math.floor(100 * uses / maxUses)}%)</>,
				...this.statisticOpts,
			}))

			return
		}

		const rows: Rows<React.ReactNode, typeof TABLE_COLUMNS> = this.trackedDefensives.map((defensive, index) => [
			<ActionLink key={index} {...defensive} />,
			this.uses.get(defensive.id) ?? 0,
			this.cooldownDowntime.calculateMaxUsages({cooldowns: [defensive]}),
		])

		this.statistics.add(new TableStatistic({
			headings: [
				'Defensive',
				'Uses',
				'Max',
			],
			rows: rows,
			...this.statisticOpts,
		}))
	}
}
