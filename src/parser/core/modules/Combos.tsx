// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Rotation from 'components/ui/Rotation'
import {ActionCombo} from 'data/ACTIONS/type'
import {iconUrl} from 'data/icon'
import {Event, Events, FieldsMultiTargeted, SourceModifier, TargetModifier} from 'event'
import _ from 'lodash'
import {dependency} from 'parser/core/Injectable'
import DISPLAY_ORDER from 'parser/core/modules/DISPLAY_ORDER'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {Analyser} from '../Analyser'
import {filter} from '../filter'
import {Data} from './Data'
import {Death} from './Death'
import Downtime from './Downtime'

const DEFAULT_GCD = 2500
const COMBO_TIMEOUT = 30000
const CONTINUE_AFTER_DOWNTIME_GRACE = 1000
const ISSUE_TYPENAMES = {
	uncomboed: <Trans id="core.combos.issuetypenames.uncomboed">Uncomboed</Trans>,
	combobreak: <Trans id="core.combos.issuetypenames.combobreak">Broken Combo</Trans>,
	failedcombo: <Trans id="core.combos.issuetypenames.failed">Missed or Invulnerable</Trans>,
	timeout: <Trans id="core.combos.issuetypenames.timeout">Expired</Trans>,
}

const ICON_ATTACK = 405

interface EventCombo extends FieldsMultiTargeted {
	action: number
}

declare module 'event' {
	interface EventTypeRepository {
		combo: EventCombo
	}
}

export interface ComboIssue {
	type: keyof typeof ISSUE_TYPENAMES
	context: Array<Events['damage']>
	event: Events['damage']
}

export class Combos extends Analyser {
	static override handle = 'combos'
	static override title = t('core.combos.title')`Combo Issues`
	static override displayOrder = DISPLAY_ORDER.COMBOS
	static override debug = false
	// This should be redefined by subclassing modules; the default is the basic 'Attack' icon
	protected suggestionIcon = iconUrl(ICON_ATTACK)

	@dependency protected data!: Data
	@dependency private death!: Death
	@dependency private downtime!: Downtime
	@dependency protected suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private lastGcdTime = this.parser.pull.timestamp
	private currentComboChain: Array<Events['damage']> = []
	private issues: ComboIssue[] = []

	override initialise() {
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('damage'), this.onCast)
		this.addEventHook(filter<Event>().actor(this.parser.actor.id).type('death'), this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private get lastComboEvent(): Events['damage'] | undefined {
		return _.last(this.currentComboChain)
	}

	private get lastAction(): number | undefined {
		const lastComboEvent = this.lastComboEvent
		if (!lastComboEvent || lastComboEvent.cause.type !== 'action') {
			return undefined
		}

		return lastComboEvent.cause.action
	}

	private get comboBreakers(): Array<Events['damage']> {
		return this.issues
			.filter(issue => issue.type === 'combobreak')
			.map(issue => issue.event)
	}

	private get uncomboedGcds(): Array<Events['damage']> {
		return this.issues
			.filter(issue => issue.type === 'uncomboed')
			.map(issue => issue.event)
	}

	protected fabricateComboEvent(event: Events['damage']) {
		if (event.cause.type !== 'action') {
			return
		}
		this.parser.queueEvent({
			type: 'combo',
			timestamp: event.timestamp,
			action: event.cause.action,
			source: event.source,
			targets: event.targets,
		})
	}

	private recordBrokenCombo(event: Events['damage'], context: Array<Events['damage']>) {
		if (!this.isAllowableComboBreak(event, context)) {
			this.issues.push({
				type: 'combobreak',
				event,
				context,
			})
		}
		this.currentComboChain = []
	}

	private recordUncomboedGcd(event: Events['damage']) {
		this.issues.push({
			type: 'uncomboed',
			event,
			context: [],
		})
		this.currentComboChain = []
	}

	private recordFailedCombo(event: Events['damage'], context: Array<Events['damage']>) {
		this.issues.push({
			type: 'failedcombo',
			event,
			context,
		})
		this.currentComboChain = []
	}

	private recordExpiredCombo(event: Events['damage'], context: Array<Events['damage']>) {
		this.issues.push({
			type: 'timeout',
			event,
			context,
		})
	}

	/**
	 *
	 * @param combo
	 * @param event
	 * @return true if combo, false otherwise
	 */
	protected checkCombo(combo: ActionCombo, event: Events['damage']): boolean {
		const lastAction = this.lastAction
		// Not in a combo
		if (lastAction == null) {
			// Combo starter, we good
			if (combo.start) {
				this.fabricateComboEvent(event)
				return true
			}

			// Combo action that isn't a starter, that's a paddlin'
			this.recordUncomboedGcd(event)
			return false
		}

		if (combo.start) {
			// Broken combo - starting a new combo while in a current combo
			this.recordBrokenCombo(event, this.currentComboChain)
			return true // Start a new combo
		}

		const fromOptions = Array.isArray(combo.from) ? combo.from : [combo.from]
		if (fromOptions.includes(lastAction)) {
			// Combo continued correctly
			this.fabricateComboEvent(event)
			// If it's a finisher, reset the combo
			return !combo.end
		}

		// Action did not continue combo correctly and is not a new combo starter
		this.recordBrokenCombo(event, this.currentComboChain)
		return false
	}

	/**This method provides the functionality to implementers of combo extensions to specify actions
	 * that do no damage but break combos anyway.  RDM Manafication being an example.  All the checks
	 * and fabrication of an EventDamage object to be recorded on break are handled within.
	 */
	protected onNonDamageCast(event: Events['action']) {
		this.debug(`onNonDamageCast Hit in Combos for actionID: ${event.action}`)

		if (!event) {
			return
		}

		const action = this.data.getAction(event.action)

		if (!action) {
			return
		}

		if (action.breaksCombo && this.lastAction != null) {
			this.debug(`onNonDamageCast Hit in Combos for action: ${action.name} Breaks Combo at ${this.parser.formatEpochTimestamp(event.timestamp, 1)}`)

			// We fabricate a damage event here due to the fact that everything downstream expects the fields of the EventDamage interface
			// an attempt was made to get away with just fabricating a rotation event, but that proved to be a nonstarter for the rest of the logic in this class
			// as such we fabricate the much larger event and if it's a combo break we push it, however we only fabricate the event if it's an actual combo break.
			const fabEvent: Events['damage'] = {
				cause: {
					type: 'action',
					action: event.action,
				},
				source: event.source,
				targets:  [{
					target: event.target,
					amount: 0,
					bonusPercent: 0,
					overkill: 0,
					sourceModifier: SourceModifier.NORMAL,
					targetModifier: TargetModifier.NORMAL}],
				timestamp: event.timestamp,
				sequence: event.action,
				type: 'damage',
			}
			// Combo breaking action, that's a paddlin'
			this.recordBrokenCombo(fabEvent, this.currentComboChain)
		}
	}

	protected onPreparedCast(event: Events['prepare']) {
		this.debug(`onPreparedCast Hit in Combos for actionID: ${event.action}`)
		const action = this.data.getAction(event.action)

		//Verify it's an action.
		if (!action) {
			return
		}

		//Now check for combo and break it if exists.  Making certain we check for this.lastAction so we don't flag every GCD in the log.
		if (action.onGcd && (action.combo != null || action.breaksCombo) && this.lastAction != null) {
			// We fabricate a damage event here due to the fact that everything downstream expects the fields of the EventDamage interface
			this.debug(`onPreparedCast Hit in Combos for action: ${action.name} Breaks Combo at ${this.parser.formatEpochTimestamp(event.timestamp, 1)}`)
			const fabEvent: Events['damage'] = {
				cause: {
					type: 'action',
					action: event.action,
				},
				source: event.source,
				targets:  [{
					target: event.target,
					amount: 0,
					bonusPercent: 0,
					overkill: 0,
					sourceModifier: SourceModifier.NORMAL,
					targetModifier: TargetModifier.NORMAL}],
				timestamp: event.timestamp,
				sequence: event.action,
				type: 'damage',
			}
			// Combo breaking action, that's a paddlin'
			this.recordBrokenCombo(fabEvent, this.currentComboChain)
		}
	}

	private onCast(event: Events['damage']) {
		if (event.cause.type !== 'action') {
			return
		}
		const action = this.data.getAction(event.cause.action)

		if (!action) {
			return
		}

		// Only track GCDs that either progress or break combos so actions like Drill and Shadow Fang don't falsely extend the simulated combo timer
		if (action.onGcd && (action.combo != null || action.breaksCombo)) {
			const comboExpiration = this.lastGcdTime + COMBO_TIMEOUT
			if (event.timestamp > comboExpiration && this.currentComboChain.length > 0) {
				if (!(this.downtime.getDowntime(comboExpiration - CONTINUE_AFTER_DOWNTIME_GRACE, comboExpiration) > 0)) {
					// Forgive the combo expiration if there was downtime within 1 second of the combo expiration (if downtime ends more than 1 second before combo expiration, record the timeout)
					this.recordExpiredCombo(event, this.currentComboChain)
				}
				// If we've had enough downtime between GCDs to let the combo expire, reset the state so we don't count erroneous combo breaks
				this.currentComboChain = []
			}

			this.lastGcdTime = event.timestamp
		}

		// If it's a combo action, run it through the combo checking logic
		if (action.combo) {
			if (event.targets.every(t => t.sourceModifier === SourceModifier.MISS)) {
				// Misses break combo
				this.recordFailedCombo(event, this.currentComboChain)
				return
			}

			const continueCombo = this.checkCombo(action.combo, event)
			if (continueCombo) {
				this.currentComboChain.push(event)
			} else {
				this.currentComboChain = []
			}
		}

		if (action.breaksCombo && this.lastAction != null) {
			// Combo breaking action, that's a paddlin'
			this.recordBrokenCombo(event, this.currentComboChain)
		}
	}

	private onDeath() {
		// Forgive combo breaks on death (the death ding is higher priority)
		this.currentComboChain = []
	}

	private onComplete() {
		if (this.addJobSpecificSuggestions(this.comboBreakers, this.uncomboedGcds)) {
			return
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="core.combos.content">
				<p>Avoid breaking combos, as failing to complete combos costs you a significant amount of DPS and important secondary effects.</p>
				<p>Using a combo GCD at the wrong combo step, using non-combo GCDs while inside a combo, missing, or attacking a target that is invulnerable will cause your combo to break.</p>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.issues.length,
			why: <Plural
				id="core.combos.why"
				value={this.issues.length}
				one="You misused # combo action."
				other="You misused # combo actions."
			/>,
		}))
	}

	/**
	 * Jobs MAY override this to add additional suggestions beyond the default
	 * @param comboBreakers An array of combos that were broken (not completed with a combo finisher)
	 * @param uncomboedGcds An array of combo actions that were used outside of a combo (events that combo from other events, but were used when no combo chain was active)
	 * @returns true to prevent adding the default suggestion, or false to include the default suggestions
	 */
	protected addJobSpecificSuggestions(_comboBreakers: Array<Events['damage']>, _uncomboedGcds: Array<Events['damage']>): boolean {
		return false
	}

	/**
	 * Jobs MAY override this to indicate whether this broken combo is allowed.
	 * Return true to indicate an allowable combo break, which will result in this break not being recorded and the current combo will be cleared with no other side effects.
	 * Return false to record the combo break and display it to the user
	 * @param event The event that caused the combo break
	 * @param context The active combo chain that is being broken
	 * @returns true if this combo break should not be recorded
	 */
	protected isAllowableComboBreak(_event: Events['damage'], _context: Array<Events['damage']>): boolean {
		return false
	}

	// Helper needed to make this.timeline.show behave, remove when timeline is a Sith and deals in absolutes
	private relativeTimestamp(timestamp: number) {
		return timestamp - this.parser.pull.timestamp
	}

	override output(): React.ReactNode {
		if (this.issues.length <= 0) {
			return false
		}

		const data = this.issues.sort((a, b) => a.event.timestamp - b.event.timestamp)

		return <Table compact unstackable celled textAlign="center">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.combos-table.header.starttime">Start Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.combos-table.header.comboactions">Combo Actions</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.combos-table.header.brokentime">Broken Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.combos-table.header.combobreaker">Combo Breaker</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.combos-table.header.reason">Reason</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					data.map(issue => {
						const completeContext = [...(issue.context || []), issue.event]

						const startEvent = completeContext[0]
						const brokenTime = issue.type !== 'timeout' ? completeContext[completeContext.length-1].timestamp : startEvent.timestamp + COMBO_TIMEOUT

						return <Table.Row key={startEvent.timestamp}>
							<Table.Cell style={{whiteSpace: 'nowrap'}}>
								{issue.context.length > 0 &&
									<>
										<span>{this.parser.formatEpochTimestamp(startEvent.timestamp, 0)}</span>
										<Button style={{marginLeft: 5}}
											circular
											compact
											size="mini"
											icon="time"
											onClick={() => this.timeline.show(this.relativeTimestamp(startEvent.timestamp), this.relativeTimestamp(brokenTime + DEFAULT_GCD))}
										/>
									</>}
							</Table.Cell>
							<Table.Cell>
								<Rotation events={issue.context} />
							</Table.Cell>
							<Table.Cell style={{whiteSpace: 'nowrap'}}>
								<>
									<span>{this.parser.formatEpochTimestamp(brokenTime, 0)}</span>
									{issue.context.length === 0 &&
									<Button style={{marginLeft: 5}}
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(this.relativeTimestamp(brokenTime - DEFAULT_GCD), this.relativeTimestamp(brokenTime + DEFAULT_GCD))}
									/>}
								</>
							</Table.Cell>
							<Table.Cell>
								{issue.type !== 'timeout' && <Rotation events={[issue.event]}/>}
							</Table.Cell>
							<Table.Cell>
								<span style={{whiteSpace: 'nowrap'}}>{ISSUE_TYPENAMES[issue.type]}</span>
							</Table.Cell>
						</Table.Row>
					})
				}
			</Table.Body>
		</Table>
	}
}
