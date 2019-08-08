// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import {AoeEvent} from 'parser/core/modules/AoE'
import DISPLAY_ORDER from 'parser/core/modules/DISPLAY_ORDER'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const DEFAULT_GCD = 2.5
const GCD_TIMEOUT_MILLIS = 15000
const ISSUE_TYPENAMES = {
	uncomboed: <Trans id="core.combos.issuetypenames.uncomboed">Uncomboed</Trans>,
	combobreak: <Trans id="core.combos.issuetypenames.combobreak">Broken Combo</Trans>,
	failedcombo: <Trans id="core.combos.issuetypenames.failed">Missed or Invulnerable</Trans>,
}

export interface ComboEvent extends AoeEvent {
	type: 'combo'
}

export interface ComboIssue {
	type: keyof typeof ISSUE_TYPENAMES
	context: AoeEvent[]
	event: AoeEvent
}

export default class Combos extends Module {
	static handle = 'combos'
	static title = t('core.combos.title')`Combo Issues`
	static displayOrder = DISPLAY_ORDER.COMBOS

	// This should be redefined by subclassing modules; the default is the basic 'Attack' icon
	static suggestionIcon = 'https://xivapi.com/i/000000/000405.png'

	@dependency protected suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private lastGcdTime = this.parser.fight.start_time
	private currentComboChain: AoeEvent[] = []
	private issues: ComboIssue[] = []

	protected init() {
		this.addHook('aoedamage', {by: 'player'}, this.onCast)
		this.addHook('complete', this.onComplete)
	}

	private get lastComboEvent(): AoeEvent | null {
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

	protected fabricateComboEvent(event: AoeEvent) {
		const combo: ComboEvent = {
			...event,
			type: 'combo',
		}
		delete combo.timestamp // Since fabricateEvent adds that in anyway
		this.parser.fabricateEvent(combo)
	}

	protected recordBrokenCombo(event: AoeEvent, context: AoeEvent[]) {
		if (!this.isAllowableComboBreak(event, context)) {
			this.issues.push({
				type: 'combobreak',
				event,
				context,
			})
		}
		this.currentComboChain = []
	}

	protected recordUncomboedGcd(event: AoeEvent) {
		this.issues.push({
			type: 'uncomboed',
			event,
			context: [],
		})
		this.currentComboChain = []
	}

	protected recordFailedCombo(event: AoeEvent, context: AoeEvent[]) {
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
	protected checkCombo(combo: TODO /* Should be an Action type */, event: AoeEvent): boolean {
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

	private onCast(event: AoeEvent) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO // Should be an Action type

		if (!action) {
			return
		}

		if (action.onGcd) {
			if (event.timestamp - this.lastGcdTime > GCD_TIMEOUT_MILLIS) {
				// If we've had enough downtime between GCDs to let the combo expire, reset the state so we don't count erroneous combo breaks
				this.currentComboChain = []
			}

			this.lastGcdTime = event.timestamp
		}

		// If it's a combo action, run it through the combo checking logic
		if (action.combo) {
			if (!event.successfulHit) {
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
	addJobSpecificSuggestions(comboBreakers: AoeEvent[], uncomboedGcds: AoeEvent[]) {
		return false
	}

	/**
	 * To be overridden by subclasses. This is called in recordBrokenCombo, and receives the event triggering the broken combo,
	 * and the context information for that break. Jobs can override this to indicate whether this broken combo is allowed. If so,
	 * the event and context will not be recorded, and the current combo will be cleared with no other side effects.
	 * Returning false will allow the break to be recorded, and displayed to the user
	 */
	isAllowableComboBreak(event: AoeEvent, context: AoeEvent[]): boolean {
		return false
	}

	output(): React.ReactNode {
		if (this.issues.length <= 0) {
			return false
		}

		// Access Alias
		const startTime = this.parser.fight.start_time

		const data = this.issues
			.sort((a, b) => a.event.timestamp - b.event.timestamp)
			.map(issue => {
				const completeContext = [...(issue.context || []), issue.event]

				const startEvent = _.first(completeContext)
				const endEvent = _.last(completeContext)
				const startAction = getDataBy(ACTIONS, 'id', startEvent!.ability.guid) as TODO // Should be an Action type
				const endAction = getDataBy(ACTIONS, 'id', endEvent!.ability.guid) as TODO // Should be an Action type

				return ({
					start: startEvent!.timestamp - startTime + (startAction.cooldown || DEFAULT_GCD),
					end: endEvent!.timestamp - startTime + (endAction.cooldown || DEFAULT_GCD),
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
