// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import {i18nMark, Plural, Trans} from '@lingui/react'
import {RotationTable} from 'components/ui/RotationTable'
import {getAction} from 'data/ACTIONS'
import {AbilityEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import DISPLAY_ORDER from 'parser/core/modules/DISPLAY_ORDER'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const DEFAULT_GCD = 2.5
const GCD_TIMEOUT_MILLIS = 12000
const ISSUE_TYPENAMES = {
	uncomboed: <Trans id="core.combos.issuetypenames.uncomboed">Uncomboed</Trans>,
	combobreak: <Trans id="core.combos.issuetypenames.combobreak">Broken Combo</Trans>,
}

export interface ComboEvent extends AbilityEvent {
	type: 'combo'
}

export interface ComboIssue {
	type: 'uncomboed' | 'combobreak'
	context: CastEvent[]
	event: CastEvent
}

export default class Combos extends Module {
	static handle = 'combos'
	static title = 'Combo Issues'
	static i18n_id = i18nMark('core.combos.title') // tslint:disable-line:variable-name
	static displayOrder = DISPLAY_ORDER.COMBOS

	// This should be redefined by subclassing modules; the default is the basic 'Attack' icon
	static suggestionIcon = 'https://xivapi.com/i/000000/000405.png'
	'constructor': typeof Combos // Allow for `this.constructor` to be accessed

	@dependency protected suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private lastGcdTime = this.parser.fight.start_time
	private currentComboChain: CastEvent[] = []
	private issues: ComboIssue[] = []

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('complete', this.onComplete)
	}

	private get lastComboEvent(): CastEvent | null {
		return _.last(this.currentComboChain) || null
	}

	private get lastAction() {
		const lastComboEvent = this.lastComboEvent
		if (!lastComboEvent) {
			return null
		}

		return getAction(lastComboEvent.ability.guid).id
	}

	private get brokenComboCount() {
		return this.issues
			.reduce(
				(total, issue) => issue.type === 'combobreak' ? total + 1 : total,
				0,
			)
	}

	private get uncomboedGcdCount() {
		return this.issues
			.reduce(
				(total, issue) => issue.type === 'uncomboed' ? total + 1 : total,
				0,
			)
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

	protected fabricateComboEvent(event: CastEvent) {
		const combo: ComboEvent = {
			...event,
			type: 'combo',
		}
		delete combo.timestamp // Since fabricateEvent adds that in anyway
		this.parser.fabricateEvent(combo)
	}

	protected recordBrokenCombo(event: CastEvent, context: CastEvent[]) {
		this.issues.push({
			type: 'combobreak',
			event,
			context,
		})
		this.currentComboChain = []
	}

	protected recordUncomboedGcd(event: CastEvent) {
		this.issues.push({
			type: 'uncomboed',
			event,
			context: [],
		})
		this.currentComboChain = []
	}

	/**
	 *
	 * @param combo
	 * @param event
	 * @return true if combo, false otherwise
	 */
	protected checkCombo(combo: TODO /* Should be an Action type */, event: CastEvent): boolean {
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

		// Incorrect combo action, that's a paddlin'
		if (combo.from !== this.lastAction) {
			this.recordBrokenCombo(event, this.currentComboChain)
			return combo.start // It's a combo if the action is the start of one
		}

		// Combo continued correctly
		this.fabricateComboEvent(event)
		// If it's a finisher, reset the combo
		return !combo.end
	}

	private onCast(event: CastEvent) {
		const action = getAction(event.ability.guid) as TODO // Should be an Action type

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
		if (this.issues.length > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.constructor.suggestionIcon,
				content: <Trans id="core.combos.content">
					Avoid misusing your combo GCDs at the wrong combo step or breaking existing combos with non-combo
					GCDs. Breaking combos can cost you significant amounts DPS as well as important secondary effects.
				</Trans>,
				severity: SEVERITY.MEDIUM, // TODO
				why: <Plural
					id="core.combos.why"
					value={this.issues.length}
					one="You misused # combo action."
					other="You misused # combo actions."
				/>,
			}))
		}
	}

	addJobSpecificSuggestions(comboBreakers: CastEvent[], uncomboedGcds: CastEvent[]) {
		// To be overridden by subclasses. This is called in _onComplete() and passed two arrays of event objects - one for events that
		// broke combos, and one for combo GCDs used outside of combos. Subclassing modules can add job-specific suggestions based on
		// what particular actions were misused and when in the fight.
		// The overriding module should return true if the default suggestion is not wanted
		return false
	}

	output(): React.ReactNode {
		if (this.issues.length > 0) {
			return <RotationTable
				notes={[
					{
						header: <Trans id="core.combos.rotationtable.header.reason">Reason</Trans>,
						accessor: 'reason',
					},
				]}
				data={this.issues
					.sort((a, b) => a.event.timestamp - b.event.timestamp)
					.map(issue => {
						const startTime = this.parser.fight.start_time
						const completeContext = [...(issue.context || []), issue.event]

						const startEvent = _.first(completeContext)
						const endEvent = _.last(completeContext)
						const startAction = getAction(startEvent!.ability.guid) as TODO
						const endAction = getAction(endEvent!.ability.guid) as TODO

						return ({
							start: startEvent!.timestamp - startTime + (startAction.cooldown || DEFAULT_GCD),
							end: endEvent!.timestamp - startTime + (endAction.cooldown || DEFAULT_GCD),
							rotation: completeContext,
							notesMap: {
								reason: <span style={{whiteSpace: 'nowrap'}}>{ISSUE_TYPENAMES[issue.type]}</span>,
							},
						})
					})}
				onGoto={this.timeline.show}
			/>
		}

		return false
	}
}
