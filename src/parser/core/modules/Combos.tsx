// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Rotation from 'components/ui/Rotation'
import {ActionCombo} from 'data/ACTIONS/type'
import {iconUrl} from 'data/icon'
import {Cause, Event, Events, FieldsMultiTargeted, SourceModifier} from 'event'
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

export interface ComboBreak {
	timestamp: number
	cause: Cause
}
export interface ComboIssue {
	type: keyof typeof ISSUE_TYPENAMES
	context: Array<Events['damage']>
	breaker: ComboBreak
}

export class Combos extends Analyser {
	static override handle = 'combos'
	static override title = t('core.combos.title')`Combo Issues`
	static override displayOrder = DISPLAY_ORDER.COMBOS

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

	protected get lastAction(): number | undefined {
		const lastComboEvent = this.lastComboEvent
		if (!lastComboEvent || lastComboEvent.cause.type !== 'action') {
			return undefined
		}

		return lastComboEvent.cause.action
	}

	private get comboBreakers(): ComboBreak[] {
		return this.issues
			.filter(issue => issue.type === 'combobreak')
			.map(issue => issue.breaker)
	}

	private get uncomboedGcds(): ComboBreak[] {
		return this.issues
			.filter(issue => issue.type === 'uncomboed')
			.map(issue => issue.breaker)
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

	protected recordBrokenCombo(breaker: ComboBreak) {
		const context = this.currentComboChain
		if (!this.isAllowableComboBreak(breaker, context)) {
			this.issues.push({
				type: 'combobreak',
				breaker,
				context,
			})
		}
		this.currentComboChain = []
	}

	private recordUncomboedGcd(breaker: ComboBreak) {
		this.issues.push({
			type: 'uncomboed',
			breaker,
			context: [],
		})
		this.currentComboChain = []
	}

	private recordFailedCombo(breaker: ComboBreak) {
		this.issues.push({
			type: 'failedcombo',
			breaker,
			context: this.currentComboChain,
		})
		this.currentComboChain = []
	}

	private recordExpiredCombo(breaker: ComboBreak) {
		this.issues.push({
			type: 'timeout',
			breaker,
			context: this.currentComboChain,
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
			this.recordBrokenCombo(event)
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
		this.recordBrokenCombo(event)
		return false
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
					this.recordExpiredCombo(event)
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
				this.recordFailedCombo(event)
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
			this.recordBrokenCombo(event)
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
	protected addJobSpecificSuggestions(_comboBreakers: ComboBreak[], _uncomboedGcds: ComboBreak[]): boolean {
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
	protected isAllowableComboBreak(_breaker: ComboBreak, _context: Array<Events['damage']>): boolean {
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

		const data = this.issues.sort((a, b) => a.breaker.timestamp - b.breaker.timestamp)

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
						const startEvent = issue.context[0]
						const brokenTime = issue.type !== 'timeout' ? issue.breaker.timestamp : startEvent.timestamp + COMBO_TIMEOUT

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
								{issue.type !== 'timeout' && <Rotation events={[issue.breaker]}/>}
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
