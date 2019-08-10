import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'

import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'

const FORM_TIMEOUT_MILLIS = 15000

const FORMS = [
	STATUSES.OPO_OPO_FORM.id,
	STATUSES.RAPTOR_FORM.id,
	STATUSES.COEURL_FORM.id,
]

const OPO_OPO_SKILLS = [
	ACTIONS.BOOTSHINE.id,
	ACTIONS.DRAGON_KICK.id,
	ACTIONS.ARM_OF_THE_DESTROYER.id,
]

export default class Forms extends Module {
	static handle = 'forms'

	@dependency private combatants!: Combatants
	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions

	private formless: number = 0
	private poorForms: number = 0
	private resetForms: number = 0
	private skippedForms: number = 0
	private droppedForms: number = 0

	private lastFormChanged?: number
	private lastFormDropped?: number

	protected init(): void {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('applybuff', {to: 'player', abilityId: FORMS}, this.onGain)
		this.addHook('removebuff', {to: 'player', abilityId: FORMS}, this.onRemove)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO

		if (!action) {
			return
		}

		if (action.onGcd) {
			// Check the current form and stacks, or zero for no form
			const currentForm = FORMS.find(form => this.combatants.selected.hasStatus(form)) || 0
			const untargetable = this.lastFormChanged !== undefined ?
				this.downtime.getDowntime(this.lastFormChanged, event.timestamp) :
				0

			// If PB is active, we can ignore form unless someone is really derpy
			if (this.combatants.selected.hasStatus(STATUSES.PERFECT_BALANCE.id)) {
				if (action === ACTIONS.FORM_SHIFT.id) {
					this.poorForms++
				}
				return
			}

			if (action === ACTIONS.FORM_SHIFT.id) {
				// Only ignore Form Shift if we're in downtime
				if (untargetable === 0) {
					this.skippedForms++
				}

				return
			}

			// Handle relevant actions per form
			switch (currentForm) {
			case STATUSES.OPO_OPO_FORM.id:
				break
			// Using Opo-Opo skills resets form
			case STATUSES.RAPTOR_FORM.id:
			case STATUSES.COEURL_FORM.id:
				if (OPO_OPO_SKILLS.includes(action)) { this.resetForms++ }
				break
			default:
				if (OPO_OPO_SKILLS.includes(action)) {
					this.formless++
				}

				// Check if we timed out
				if (untargetable === 0 && this.lastFormDropped && this.lastFormChanged) {
					if ((this.lastFormDropped - this.lastFormChanged) > FORM_TIMEOUT_MILLIS) {
						this.droppedForms++
					}
				}

				break
			}
		}
	}

	private onGain(event: BuffEvent): void {
		this.lastFormChanged = event.timestamp
	}

	private onRemove(event: BuffEvent): void {
		this.lastFormDropped = event.timestamp
	}

	private onComplete(): void {
		// Wasting PB
		if (this.poorForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.PERFECT_BALANCE.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="mnk.forms.suggestions.perfectbalance.content">
					Avoid using <ActionLink {...ACTIONS.FORM_SHIFT}/> during <ActionLink {...STATUSES.PERFECT_BALANCE}/>. It does nothing and takes up a GCD you could better use for doing damage.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.perfectbalance.why">
					<Plural value={this.poorForms} one="GCD was" other="GCDs were" /> wasted under <StatusLink {...STATUSES.PERFECT_BALANCE}/> by <ActionLink {...ACTIONS.FORM_SHIFT}/>.
				</Trans>,
			}))
		}

		// Using the wrong form
		if (this.formless >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FORM_SHIFT.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="mnk.forms.suggestions.formless.content">
					Avoid using <ActionLink {...ACTIONS.DRAGON_KICK}/> and <ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/> outside of <StatusLink {...STATUSES.OPO_OPO_FORM}/>. Their special effects only activate when in the correct form and <ActionLink {...ACTIONS.BOOTSHINE} /> has equal or higher potency depending on crits.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.formless.why">
					<Plural value={this.formless} one="# combo-starter was" other="# combo-starters were" />  used Formlessly, cancelling this special effects.
				</Trans>,
			}))
		}

		// Cancelling forms
		if (this.resetForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FORM_SHIFT.icon,
				severity: SEVERITY.MINOR,
				content: <Trans id="mnk.forms.suggestions.reset.content">
					Try not to cancel combos by using <ActionLink {...ACTIONS.BOOTSHINE}/>, <ActionLink {...ACTIONS.DRAGON_KICK}/>, or <ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/>.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.reset.why">
					<Plural value={this.resetForms} one="# combo was" other="# combos were" /> reset by an Opo-Opo Form skill.
				</Trans>,
			}))
		}

		// Skipping a form
		if (this.skippedForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FORM_SHIFT.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.forms.suggestions.skipped.content">
					Avoid skipping Forms. You could be missing important buffs or refreshing <StatusLink {...STATUSES.GREASED_LIGHTNING}/> by skipping.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.skipped.why">
					<Plural value={this.skippedForms} one="# form was" other="# forms were" /> skipped by Form Shift unnecessarily.
				</Trans>,
			}))
		}

		// Form timeout
		if (this.droppedForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FORM_SHIFT.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="mnk.forms.suggestions.dropped.content">
					Avoid dropping Forms. You may need to use a gap closer or stay closer to the enemy to avoid your combo timing out. This usually indicates a bigger problem.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.dropped.why">
					Form was broken <Plural value={this.droppedForms} one="# time." other="# times." />
				</Trans>,
			}))
		}
	}
}
