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
import {Rows, TableStatistic, Statistics, SimpleStatistic} from 'parser/core/modules/Statistics'
import React from 'react'
import {AbstractStatisticOptions} from './Statistics/AbstractStatistic'

const DEFENSIVE_ROLE_ACTIONS: Map<RoleKey, ActionKey[]> = new Map<RoleKey, ActionKey[]>([
	['TANK', ['RAMPART', 'REPRISAL']],
	['MELEE', ['FEINT', 'BLOODBATH', 'SECOND_WIND']],
	['PHYSICAL_RANGED', ['SECOND_WIND']],
	['MAGICAL_RANGED', ['ADDLE']],
	['HEALER', []],
])
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

	private uses: Map<Action['id'], number> = new Map()

	override initialise() {
		const roleDefensives = DEFENSIVE_ROLE_ACTIONS.get(JOBS[this.parser.actor.job].role)?.map(key => this.data.actions[key]) ?? []
		roleDefensives.forEach(roleAction => {
			if (!this.trackedDefensives.find(action => roleAction.id === action.id)) {
				this.trackedDefensives.push(roleAction)
			}
		})
	}

		this.addEventHook('complete', this.onComplete)
	}

	private formatUsages(defensive: Action): React.ReactNode {
		const uses = this.uses.get(defensive.id) ?? 0
		const maxUses = this.cooldownDowntime.calculateMaxUsages({cooldowns: [defensive]})

	override output() {
		if (this.trackedDefensives.length === 0) {
			return
		}

		return <Fragment>
			<Message icon>
				<Icon name="info" />
				<Message.Content>
					{this.headerContent}
				</Message.Content>
			</Message>
			<Accordion
				exclusive={false}
				styled
				fluid
				panels={
					this.trackedDefensives.map((defensive, index) => {
						return {
							key: defensive.id,
							title: {
								content: <><ActionLink key={index} {...defensive} /> - {this.getUses(defensive)} / {this.getMaxUses(defensive)}</>,
							},
							content: {
								content: <Table compact unstackable celled>
									<Table.Body>
										{
											this.tryGetAdditionalUseRow(defensive)
										}
										{
											this.cooldowns.cooldownHistory(defensive).map((entry) => {
												return this.getUsageRow(entry, defensive)
											})
										}
									</Table.Body>
								</Table>,
							},
						}
					})
				}
			/>
		</Fragment>
	}

	private getUsageRow(entry: CooldownHistoryEntry, defensive: Action): ReactNode {
		return <>
			<Table.Row key={entry.start}>
				<Table.Cell>
					<Trans id="core.defensives.table.usage-row.text">Used at <Button
						circular
						compact
						size="mini"
						icon="time"onClick={() => this.timeline.show(entry.start - this.parser.pull.timestamp, entry.end - this.parser.pull.timestamp)}>
					</Button> {this.parser.formatEpochTimestamp(entry.start)}
					</Trans>
				</Table.Cell>
			</Table.Row>
			{
				this.tryGetAdditionalUseRow(defensive, entry.start)
			}
		</>
	}

	private tryGetAdditionalUseRow(defensive: Action, timestamp: number = this.parser.pull.timestamp): ReactNode {
		let availableTimestamp: number, currentCharges

		if (timestamp === this.parser.pull.timestamp) {
			availableTimestamp = this.parser.pull.timestamp
			currentCharges = defensive.charges || 1
		} else {
			const chargesAvailableEvent = this.cooldowns.chargeHistory(defensive).find(charges => charges.timestamp >= timestamp && charges.current > 0)
			availableTimestamp = chargesAvailableEvent?.timestamp || (this.parser.pull.duration + this.parser.pull.timestamp)
			currentCharges = chargesAvailableEvent?.current || 0
		}

		const cooldown = defensive.cooldown || this.parser.pull.duration
		const nextEntry = this.cooldowns.cooldownHistory(defensive).find(historyEntry => historyEntry.start > timestamp)
		const useByTimestamp = nextEntry != null ? (nextEntry.start - cooldown) : (this.parser.pull.timestamp + this.parser.pull.duration)

		if (useByTimestamp <= availableTimestamp) {
			return <></>
		}

		const chargesBeforeNextUse = currentCharges + Math.floor((useByTimestamp - availableTimestamp) / cooldown)
		return <Table.Row>
			<Table.Cell>
				<Trans id="core.defensives.table.extra-usage-row.text"><Plural value={chargesBeforeNextUse} one="1 extra use" other="# extra uses"/> available between <Button
					circular
					compact
					size="mini"
					icon="time"onClick={() => this.timeline.show(availableTimestamp - this.parser.pull.timestamp, useByTimestamp - this.parser.pull.timestamp)}>
				</Button> {this.parser.formatEpochTimestamp(availableTimestamp)} and {this.parser.formatEpochTimestamp(useByTimestamp)}
				</Trans>
			</Table.Cell>
		</Table.Row>
	}
}
