import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import {JOBS, RoleKey} from 'data/JOBS'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import {Data} from 'parser/core/modules/Data'
import React, {Fragment, ReactNode} from 'react'
import {Accordion, Button, Icon, Message, Table} from 'semantic-ui-react'
import {CooldownEndReason, CooldownHistoryEntry, Cooldowns} from './Cooldowns'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {Timeline} from './Timeline'

const DEFENSIVE_ROLE_ACTIONS: Map<RoleKey, ActionKey[]> = new Map<RoleKey, ActionKey[]>([
	['TANK', ['RAMPART', 'REPRISAL']],
	['MELEE', ['FEINT', 'BLOODBATH', 'SECOND_WIND']],
	['PHYSICAL_RANGED', ['SECOND_WIND']],
	['MAGICAL_RANGED', ['ADDLE']],
	['HEALER', []],
])

export class Defensives extends Analyser {
	static override handle = 'defensives'
	static override title = t('core.defensives.title')`Defensives`
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES

	@dependency protected cooldowns!:Cooldowns
	@dependency protected cooldownDowntime!: CooldownDowntime
	@dependency protected data!: Data
	@dependency private timeline!: Timeline

	/**
	 * Implementing modules should provide a list of job-specific defensive actions to track
	 */
	protected trackedDefensives: Action[] = []
	/**
	 * Implementing modules may override the main header message text
	 */
	protected headerContent: ReactNode = <Trans id="core.defensives.header.content">
		Using your mitigation and healing cooldowns can help you survive mistakes, or relieve some stress on the healers and let them deal more damage.<br/>
		While you shouldn't use them at the expense of your rotation or buff alignment, you should try to find helpful times to use them.
	</Trans>

	override initialise() {
		const roleDefensives = DEFENSIVE_ROLE_ACTIONS.get(JOBS[this.parser.actor.job].role)?.map(key => this.data.actions[key]) ?? []
		roleDefensives.forEach(roleAction => {
			if (!this.trackedDefensives.find(action => roleAction.id === action.id)) {
				this.trackedDefensives.push(roleAction)
			}
		})
	}

	private getUsageCount(defensive: Action): number {
		return this.getUses(defensive).length
	}

	private getUses(defensive: Action): CooldownHistoryEntry[] {
		return this.cooldowns.cooldownHistory(defensive).filter((entry) => entry.endReason !== CooldownEndReason.INTERRUPTED)
	}

	private getMaxUses(defensive: Action): number {
		const totalAdditionalUses = this.getUses(defensive).reduce((acc, usage) => acc + this.getAdditionalUsageData(defensive, usage.start).chargesBeforeNextUse, this.getAdditionalUsageData(defensive).chargesBeforeNextUse)
		return this.getUsageCount(defensive) + totalAdditionalUses
	}

	override output() {
		if (this.trackedDefensives.length === 0) {
			return
		}

		return <Fragment>
			<Message icon>
				<Icon name="info" />
				<Message.Content>
					{this.headerContent}
					<br/><br/>
					<Trans id="core.defensives.header.sub-content">
						The below tables will show you where you can gain additional uses of these cooldowns, without interfering with your existing ones.
					</Trans>
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
								content: <><ActionLink key={index} {...defensive} /> - {this.getUsageCount(defensive)} / {this.getMaxUses(defensive)}</>,
							},
							content: {
								content: <Table compact unstackable celled>
									<Table.Body>
										{
											this.tryGetAdditionalUseRow(defensive)
										}
										{
											this.getUses(defensive).map((entry) => {
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

	private getAdditionalUsageData(defensive: Action, timestamp: number = this.parser.pull.timestamp): {chargesBeforeNextUse: number, availableTimestamp: number, useByTimestamp: number} {
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
		const nextEntry = this.getUses(defensive).find(historyEntry => historyEntry.start > timestamp)
		const useByTimestamp = nextEntry != null ? (nextEntry.start - cooldown) : (this.parser.pull.timestamp + this.parser.pull.duration)

		if (useByTimestamp <= availableTimestamp) {
			return {chargesBeforeNextUse: 0, availableTimestamp, useByTimestamp}
		}

		return {chargesBeforeNextUse: currentCharges + Math.floor((useByTimestamp - availableTimestamp) / cooldown), availableTimestamp, useByTimestamp}
	}

	private tryGetAdditionalUseRow(defensive: Action, timestamp: number = this.parser.pull.timestamp): ReactNode {
		const {chargesBeforeNextUse, availableTimestamp, useByTimestamp} = this.getAdditionalUsageData(defensive, timestamp)

		if (chargesBeforeNextUse === 0) {
			return <></>
		}

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
