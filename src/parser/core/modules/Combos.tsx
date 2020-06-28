// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {RotationTable} from 'components/ui/RotationTable'
import {DamageEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import DISPLAY_ORDER from 'parser/core/modules/DISPLAY_ORDER'
import {NormalisedDamageEvent, NormalisedEventFields} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Data} from './Data'

const DEFAULT_GCD = 2.5
const GCD_TIMEOUT_MILLIS = 15000
const ISSUE_TYPENAMES = {
	uncomboed: <Trans id="core.combos.issuetypenames.uncomboed">Uncomboed</Trans>,
	combobreak: <Trans id="core.combos.issuetypenames.combobreak">Broken Combo</Trans>,
	failedcombo: <Trans id="core.combos.issuetypenames.failed">Missed or Invulnerable</Trans>,
}

export class ComboEvent extends NormalisedEventFields {
	type = 'combo' as const
	calculatedEvents: DamageEvent[] = []
	confirmedEvents: DamageEvent[] = []

	constructor(event: NormalisedDamageEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
		this.calculatedEvents = event.calculatedEvents.slice(0)
		this.confirmedEvents = event.confirmedEvents.slice(0)
	}
}

declare module 'events' {
	interface EventTypeRepository {
		combos: ComboEvent
	}
}

export interface ComboIssue {
	type: keyof typeof ISSUE_TYPENAMES
	context: NormalisedDamageEvent[]
	event: NormalisedDamageEvent
}

export default class Combos extends Module {
	static handle = 'combos'
	static title = t('core.combos.title')`Combo Issues`
	static displayOrder = DISPLAY_ORDER.COMBOS

	// This should be redefined by subclassing modules; the default is the basic 'Attack' icon
	static suggestionIcon = 'https://xivapi.com/i/000000/000405.png'

	@dependency private data!: Data
	@dependency protected suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private lastGcdTime = this.parser.eventTimeOffset
	private currentComboChain: NormalisedDamageEvent[] = []
	private issues: ComboIssue[] = []

	protected init() {
		this.addEventHook('normaliseddamage', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private get lastComboEvent(): NormalisedDamageEvent | null {
		return _.last(this.currentComboChain) || null
	}

	private get lastAction() {
		const lastComboEvent = this.lastComboEvent
		if (!lastComboEvent) {
			return null
		}

		return lastComboEvent.ability.guid
	}

	private get comboBreakers() {
		return this.issues
			.filter(issue => issue.type === 'combobreak')
			.map(issue => issue.event)
	}

	private get uncomboedGcds() {
		return this.issues
			.filter(issue => issue.type === 'uncomboed')
			.map(issue => issue.event)
	}

	protected fabricateComboEvent(event: NormalisedDamageEvent) {
		const combo = new ComboEvent(event)
		this.parser.fabricateEvent(combo)
	}

	protected recordBrokenCombo(event: NormalisedDamageEvent, context: NormalisedDamageEvent[]) {
		if (!this.isAllowableComboBreak(event, context)) {
			this.issues.push({
				type: 'combobreak',
				event,
				context,
			})
		}
		this.currentComboChain = []
	}

	protected recordUncomboedGcd(event: NormalisedDamageEvent) {
		this.issues.push({
			type: 'uncomboed',
			event,
			context: [],
		})
		this.currentComboChain = []
	}

	protected recordFailedCombo(event: NormalisedDamageEvent, context: NormalisedDamageEvent[]) {
		this.issues.push({
			type: 'failedcombo',
			event,
			context,
		})
		this.currentComboChain = []
	}

	/**
	 *
	 * @param combo
	 * @param event
	 * @return true if combo, false otherwise
	 */
	protected checkCombo(combo: TODO /* Should be an Action type */, event: NormalisedDamageEvent): boolean {
		// Not in a combo
		if (this.lastAction == null) {
			// Combo starter, we good
			if (combo.start) {
				this.fabricateComboEvent(event)
				return true
			}

			// Combo action that isn't a starter, that's a paddlin'
			if (combo.from) {
				this.recordUncomboedGcd(event)
				return false
			}
		}

		if (combo.start) {
			// Broken combo - starting a new combo while in a current combo
			this.recordBrokenCombo(event, this.currentComboChain)
			return true // Start a new combo
		}

		// Check if action continues existing combo
		if (combo.from) {
			const fromOptions = Array.isArray(combo.from) ? combo.from : [combo.from]
			if (fromOptions.includes(this.lastAction)) {
				// Combo continued correctly
				this.fabricateComboEvent(event)
				// If it's a finisher, reset the combo
				return !combo.end
			}
		}

		// Action did not continue combo correctly and is not a new combo starter
		this.recordBrokenCombo(event, this.currentComboChain)
		return false
	}

	private onCast(event: NormalisedDamageEvent) {
		const action = this.data.getAction(event.ability.guid)

		if (!action) {
			return
		}

		// Only track GCDs that either progress or break combos so actions like Drill and Shadow Fang don't falsely extend the simulated combo timer
		if (action.onGcd && (action.combo || action.breaksCombo)) {
			if (event.timestamp - this.lastGcdTime > GCD_TIMEOUT_MILLIS) {
				// If we've had enough downtime between GCDs to let the combo expire, reset the state so we don't count erroneous combo breaks
				this.currentComboChain = []
			}

			this.lastGcdTime = event.timestamp
		}

		// If it's a combo action, run it through the combo checking logic
		if (action.combo) {
			if (!event.hasSuccessfulHit) {
				// Failed attacks break combo
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

		if (action.breaksCombo && this.lastAction !== null) {
			// Combo breaking action, that's a paddlin'
			this.recordBrokenCombo(event, this.currentComboChain)
		}
	}

	private onComplete() {
		if (this.addJobSpecificSuggestions(this.comboBreakers, this.uncomboedGcds)) {
			return
		}

		this.suggestions.add(new TieredSuggestion({
			icon: (this.constructor as typeof Combos).suggestionIcon,
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
	 * To be overridden by subclasses. This is called in _onComplete() and passed two arrays of event objects - one for events that
	 * broke combos, and one for combo GCDs used outside of combos. Subclassing modules can add job-specific suggestions based on
	 * what particular actions were misused and when in the fight.
	 * The overriding module should return true if the default suggestion is not wanted
	 */
	addJobSpecificSuggestions(comboBreakers: NormalisedDamageEvent[], uncomboedGcds: NormalisedDamageEvent[]) {
		return false
	}

	/**
	 * To be overridden by subclasses. This is called in recordBrokenCombo, and receives the event triggering the broken combo,
	 * and the context information for that break. Jobs can override this to indicate whether this broken combo is allowed. If so,
	 * the event and context will not be recorded, and the current combo will be cleared with no other side effects.
	 * Returning false will allow the break to be recorded, and displayed to the user
	 */
	isAllowableComboBreak(event: NormalisedDamageEvent, context: NormalisedDamageEvent[]): boolean {
		return false
	}

	output(): React.ReactNode {
		if (this.issues.length <= 0) {
			return false
		}

		// Access Alias
		const startTime = this.parser.eventTimeOffset

		const data = this.issues
			.sort((a, b) => a.event.timestamp - b.event.timestamp)
			.map(issue => {
				const completeContext = [...(issue.context || []), issue.event]

				const startEvent = _.first(completeContext)
				const endEvent = _.last(completeContext)
				const startAction = this.data.getAction(startEvent!.ability.guid)
				const endAction = this.data.getAction(endEvent!.ability.guid)

				return ({
					start: startEvent!.timestamp - startTime + (startAction?.cooldown ?? DEFAULT_GCD),
					end: endEvent!.timestamp - startTime + (endAction?.cooldown ?? DEFAULT_GCD),
					rotation: completeContext,
					notesMap: {
						reason: <span style={{whiteSpace: 'nowrap'}}>{ISSUE_TYPENAMES[issue.type]}</span>,
					},
				})
			})

		return <RotationTable
			notes={[
				{
					header: <Trans id="core.combos.rotationtable.header.reason">Reason</Trans>,
					accessor: 'reason',
				},
			]}
			data={data}
			onGoto={this.timeline.show}
		/>
	}
}
