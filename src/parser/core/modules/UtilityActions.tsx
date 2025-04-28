import {msg} from '@lingui/core/macro'
import {Plural, Trans} from '@lingui/react/macro'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import {Data} from 'parser/core/modules/Data'
import {Fragment, ReactNode} from 'react'
import {Accordion, Button, Icon, Message, Table} from 'semantic-ui-react'
import {ChargeHistoryEntry, CooldownEndReason, CooldownHistoryEntry, Cooldowns} from './Cooldowns'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {Timeline} from './Timeline'

const DEFAULT_FORGIVENESS_MS: number = 800

export abstract class Utilities extends Analyser {
	static override handle = 'utilities'
	static override title = msg({id: 'core.utilities.title', message: 'Utilities'})
	static override displayOrder: number = DISPLAY_ORDER.UTILITIES

	@dependency protected cooldowns!:Cooldowns
	@dependency protected cooldownDowntime!: CooldownDowntime
	@dependency protected data!: Data
	@dependency private timeline!: Timeline

	/**
	 * Implementing modules must provide a list of actions to track
	 * These should not be actions which are constrained by either MP or a gauge resource, such as The Blackest Night, Holy Sheltron, or SGE's Addersgall actions
	 */
	protected trackedActions: Action[] = []

	/**
	 * Implementing modules may wish to override this to provide more/less forgiveness on strict allowances; the default is 800ms - anything less in available
	 * to next usage will be forgiven.
	 */
	protected forgiveness_ms: number = DEFAULT_FORGIVENESS_MS

	// Private lists of the cooldown usage and charge histories so we don't keep recalculating it via calls to the cooldowns module
	private cooldownHistories: {[key: number]: CooldownHistoryEntry[]} = {}
	private chargeHistories: {[key: number]: ChargeHistoryEntry[]} = {}

	/**
	 * Implementing modules may override the main header message text
	 */
	protected headerContent: ReactNode = <Trans id="core.utilities.header.content">
		Utility actions generally don't directly increase your damage, but they may still provide situational benefits or make your job easier.<br/>
		While you shouldn't use them at the expense of your rotation or buff alignment, you should try to find helpful times to use them.
	</Trans>

	protected getUsageCount(action: Action): number {
		return this.getUses(action).length
	}

	// The cooldowns module actually returns events based on cooldown *group* so make sure we're actually getting the uses for the cooldown we asked for
	protected getUses(action: Action): CooldownHistoryEntry[] {
		return this.getGroupUses(action).filter(event => event.action.id === action.id)
	}

	protected getGroupUses(action: Action): CooldownHistoryEntry[] {
		if (this.cooldownHistories[action.id] == null) {
			this.cooldownHistories[action.id] = this.cooldowns.cooldownHistory(action).filter((entry) => entry.endReason !== CooldownEndReason.INTERRUPTED)
		}
		return this.cooldownHistories[action.id]
	}

	private getChargeHistory(action: Action) {
		if (this.chargeHistories[action.id] == null) {
			this.chargeHistories[action.id] = this.cooldowns.chargeHistory(action)
		}
		return this.chargeHistories[action.id]
	}

	private getMaxUses(action: Action): number {
		//if there is a prepull need to initialize without any additional or it'll double count. if there is no prepull, need to initialize with first usage
		let totalAdditionalUses = 0
		if (this.checkForPrepull(action)) {
			totalAdditionalUses = this.getGroupUses(action).reduce((acc, usage) => acc + this.getAdditionalUsageData(action, usage.start).chargesBeforeNextUse, 0)
		} else {
			totalAdditionalUses = this.getGroupUses(action).reduce((acc, usage) => acc + this.getAdditionalUsageData(action, usage.start).chargesBeforeNextUse, this.getAdditionalUsageData(action).chargesBeforeNextUse)
		}
		return this.getUsageCount(action) + totalAdditionalUses
	}

	private checkForPrepull(action: Action): boolean {
		let prepullBoolean: boolean = false
		if (this.getGroupUses(action).length > 0 && this.getGroupUses(action)[0].start <= this.parser.pull.timestamp) { prepullBoolean = true }
		return prepullBoolean
	}

	override output() {
		if (this.trackedActions.length === 0) {
			return
		}

		const messageContent = this.headerContent != null ?
			<>
				{this.headerContent}
				<br/><br/>
			</> :
			<></>

		return <Fragment>
			<Message icon>
				<Icon name="info" />
				<Message.Content>
					{messageContent}
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
					this.trackedActions.map((action, index) => {
						//checking if there was a prepull noted since get additional use row uses checks starting from first usage (if first usage in the beginning, no need to add initial additional)
						let firstAdditionalUsageTry: ReactNode | undefined = undefined
						if (!this.checkForPrepull(action)) {
							firstAdditionalUsageTry = this.tryGetAdditionalUseRow(action)
						}

						return {
							key: action.id,
							title: {
								content: <><ActionLink key={index} {...action} /> - {this.getUsageCount(action)} / {this.getMaxUses(action)}</>,
							},
							content: {
								content: <Table compact unstackable celled>
									<Table.Body>
										{firstAdditionalUsageTry}
										{
											this.getGroupUses(action).map((entry) => {
												return this.getUsageRow(entry, action)
											})
										}
									</Table.Body>
									{
										this.getChargesFooterMessage(action)
									}
								</Table>,
							},
						}
					})
				}
			/>
		</Fragment>
	}

	private getUsageRow(entry: CooldownHistoryEntry, action: Action): ReactNode {
		return <>
			{
				this.tryGetUsageRow(entry, action)
			}
			{
				this.tryGetAdditionalUseRow(action, entry.start)
			}
		</>
	}

	private getAdditionalUsageData(action: Action, timestamp: number = this.parser.pull.timestamp): {chargesBeforeNextUse: number, availableTimestamp: number, useByTimestamp: number} {
		let availableTimestamp: number, currentCharges

		//assume at the beginning of the fight if it's not prepulled then it was available from the beginning with the expected charges, else calculate like normal
		if (timestamp === this.parser.pull.timestamp && !this.checkForPrepull(action)) {
			availableTimestamp = this.parser.pull.timestamp
			currentCharges = action.charges || 1
		} else {
			const chargesAvailableEvent = this.getChargeHistory(action).find(charges => charges.timestamp > timestamp && charges.current > 0)
			availableTimestamp = chargesAvailableEvent?.timestamp || (this.parser.pull.duration + this.parser.pull.timestamp)
			currentCharges = chargesAvailableEvent?.current || 0
		}

		const cooldown = action.cooldown || this.parser.pull.duration
		const nextEntry = this.getGroupUses(action).find(historyEntry => historyEntry.start > timestamp)
		const useByTimestamp = nextEntry != null ? (nextEntry.start - cooldown) : (this.parser.pull.timestamp + this.parser.pull.duration)

		// if use by is before available or the usage window is less than an appropriate weave window, return 0 charges
		if (useByTimestamp <= availableTimestamp || (useByTimestamp - availableTimestamp) < this.forgiveness_ms) {
			return {chargesBeforeNextUse: 0, availableTimestamp, useByTimestamp}
		}

		return {chargesBeforeNextUse: currentCharges + Math.floor((useByTimestamp - availableTimestamp) / cooldown), availableTimestamp, useByTimestamp}
	}

	private tryGetUsageRow(entry: CooldownHistoryEntry, action: Action): ReactNode {
		// Only create the usage row if this history entry was for this cooldown, not another in the same cooldown group
		if (entry.action.id !== action.id) {
			return <></>
		}

		let chargesMessage: ReactNode = <></>
		const chargesAvailableEvent = this.getChargeHistory(action).find(charges => charges.timestamp === entry.start && charges.delta === -1)
		const currentCharges: number | undefined = chargesAvailableEvent?.current || 0

		if (action.charges != null && action.charges > 1 && currentCharges != null) {
			chargesMessage = <>. - <Trans id="core.defensives.table.usage-row.charges"><Plural value={currentCharges} one="1 charge" other="# charges"/> remaining.</Trans></>
		}

		return <Table.Row key={entry.start}>
			<Table.Cell>
				<Trans id="core.defensives.table.usage-row.text">Used at <Button
					circular
					compact
					size="mini"
					icon="time"onClick={() => this.timeline.show(entry.start - this.parser.pull.timestamp, entry.end - this.parser.pull.timestamp)}>
				</Button> {this.parser.formatEpochTimestamp(entry.start)}
				</Trans>
				{chargesMessage}
			</Table.Cell>
		</Table.Row>
	}

	private tryGetAdditionalUseRow(action: Action, timestamp: number = this.parser.pull.timestamp): ReactNode {
		const {chargesBeforeNextUse, availableTimestamp, useByTimestamp} = this.getAdditionalUsageData(action, timestamp)

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

	private getChargesFooterMessage(action: Action): ReactNode {
		if (action.charges == null || action.charges <= 1) {
			return <></>
		}

		return <Message icon>
			<Icon name="info" />
			<Message.Content>
				<Trans id="core.defensives.footer.charges-advice">
				Number of charges are displayed for abilities with charges to help guide you on a potential extra use in the fight.
				For example, if you always have 1 charge at every cast, you are likely able to use this charge at any point in the fight.
				If you are using <ActionLink {...action} /> mostly on cooldown, then using the charge may cause unintended drifting.
				If <ActionLink {...action} showIcon={false} /> has 0 charges at any point, then the previous <Plural value={action.charges - 1} one="charge" other="charges"/> may not be available.
				Careful consideration should be utilized with this feature as it is advanced-level knowledge.
				</Trans>
			</Message.Content>
		</Message>
	}
}
