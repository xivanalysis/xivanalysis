import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'

import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'

const FORM_TIMEOUT_MILLIS_200 = 10000
const FORM_TIMEOUT_MILLIS_505 = 15000

export const FORMS = [
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
	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions

	private formless: number = 0
	private resetForms: number = 0
	private skippedForms: number = 0
	private droppedForms: number = 0

	private lastFormChanged?: number
	private lastFormDropped?: number
	private perfectlyFresh?: number

	protected init(): void {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('applybuff', {to: 'player', abilityId: FORMS}, this.onGain)
		this.addEventHook('refreshbuff', {to: 'player', abilityId: FORMS}, this.onGain)
		this.addEventHook('removebuff', {to: 'player', abilityId: FORMS}, this.onRemove)
		this.addEventHook('removebuff', {to: 'player', abilityId: STATUSES.PERFECT_BALANCE.id}, this.onPerfectOut)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		const action = this.data.getAction(event.ability.guid)

		if (!action) {
			return
		}

		const FORM_TIMEOUT_MILLIS = this.parser.patch.before('5.05')
			? FORM_TIMEOUT_MILLIS_200
			: FORM_TIMEOUT_MILLIS_505

		if (action.onGcd) {
			// Check the current form and stacks, or zero for no form
			const currentForm = FORMS.find(form => this.combatants.selected.hasStatus(form)) || 0
			const untargetable = this.lastFormChanged != null
				? this.downtime.getDowntime(this.lastFormChanged, event.timestamp)
				: 0

			if (action.id === ACTIONS.FORM_SHIFT.id) {
				// Only ignore Form Shift if we're in downtime
				if (untargetable === 0) {
					this.skippedForms++
				}

				return
			}

			// If we have PB, we can just ignore forms
			if (this.combatants.selected.hasStatus(STATUSES.PERFECT_BALANCE.id)) { return }

			// Handle relevant actions per form
			switch (currentForm) {
			case STATUSES.OPO_OPO_FORM.id:
				break

			// Using Opo-Opo skills resets form
			case STATUSES.RAPTOR_FORM.id:
			case STATUSES.COEURL_FORM.id:
				if (OPO_OPO_SKILLS.includes(action.id)) { this.resetForms++ }
				break

			default:
				// Fresh out of PB, they'll have no form
				if (this.perfectlyFresh) {
					this.perfectlyFresh = undefined
					return
				}

				// Check if we timed out
				if (untargetable === 0 && this.lastFormDropped && this.lastFormChanged) {
					if ((this.lastFormDropped - this.lastFormChanged) > FORM_TIMEOUT_MILLIS) {
						this.droppedForms++
					}
				}

				// No form used
				if (OPO_OPO_SKILLS.includes(action.id)) {
					this.formless++
				}
			}
		}
	}

	// Anatman doesn't freeze, it just refreshes every tick, so it's the same as a gain
	private onGain(event: BuffEvent): void {
		this.lastFormChanged = event.timestamp
	}

	private onRemove(event: BuffEvent): void {
		this.lastFormDropped = event.timestamp
	}

	private onPerfectOut(event: BuffEvent): void {
		this.perfectlyFresh = event.timestamp
	}

	private onComplete(): void {
		// Using the wrong form
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FORM_SHIFT.icon,
			content: <Trans id="mnk.forms.suggestions.formless.content">
				Avoid using combo starters outside of <StatusLink {...STATUSES.OPO_OPO_FORM}/> as the form bonus is only activated in the correct form.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this.formless,
			why: <Trans id="mnk.forms.suggestions.formless.why">
				<Plural value={this.formless} one="# combo-starter was" other="# combo-starters were" /> used Formlessly, cancelling form bonus effects.
			</Trans>,
		}))

		// Cancelling forms
		if (this.resetForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FORM_SHIFT.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.forms.suggestions.reset.content">
					Try not to cancel combos by using <ActionLink {...ACTIONS.BOOTSHINE}/>, <ActionLink {...ACTIONS.DRAGON_KICK}/>, or <ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/> mid-rotation.
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
					Avoid skipping Forms outside of downtime. You could be missing important buffs or refreshing <StatusLink {...STATUSES.GREASED_LIGHTNING}/> by skipping.
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
					Form was dropped <Plural value={this.droppedForms} one="# time." other="# times." />
				</Trans>,
			}))
		}
	}
}
