import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {FORM_TIMEOUT_MILLIS, FORMS, OPO_OPO_ACTIONS} from './constants'
import {fillActions, fillStatuses} from './utilities'

export class Forms extends Analyser {
	static override handle = 'forms'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions

	private forms: Array<Status['id']> = []
	private opoOpoSkills: Array<Action['id']> = []

	private formless: number = 0
	private resetForms: number = 0
	private skippedForms: number = 0
	private droppedForms: number = 0

	private lastFormChanged: number | undefined
	private lastFormDropped: number | undefined
	private perfectlyFresh?: number

	private formHook?: EventHook<Events['action']>

	override initialise(): void {
		this.forms = fillStatuses(FORMS, this.data)
		this.opoOpoSkills = fillActions(OPO_OPO_ACTIONS, this.data)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(oneOf(this.forms)), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(oneOf(this.forms)), this.onRemove)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.PERFECT_BALANCE.id), this.onPerfectOut)

		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		if (action == null || !(action.onGcd ?? false)) { return }

		// Check the current form, or zero for no form
		const currentForm = this.forms.find(form => this.actors.current.hasStatus(form)) || 0
		const untargetable = this.lastFormChanged != null
			? this.downtime.getDowntime(this.lastFormChanged, event.timestamp)
			: 0

		if (action.id === this.data.actions.FORM_SHIFT.id) {
			// Only ignore Form Shift if we're in downtime
			if (untargetable === 0) {
				this.skippedForms++
			}

			return
		}

		// If we have PB/FS, we can just ignore forms
		if (
			this.actors.current.hasStatus(this.data.statuses.PERFECT_BALANCE.id) ||
			this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id)
		) { return }

		// Handle relevant actions per form
		switch (currentForm) {
		case this.data.statuses.OPO_OPO_FORM.id:
			break

		// Using Opo-Opo skills resets form, but we don't care if we're in PB or FS
		case this.data.statuses.RAPTOR_FORM.id:
		case this.data.statuses.COEURL_FORM.id:
			if (this.opoOpoSkills.includes(action.id)) { this.resetForms++ }
			break

		default:
			// Fresh out of PB, they'll have no form
			if (this.perfectlyFresh != null) {
				this.perfectlyFresh = undefined
				return
			}

			// Check if we timed out
			if (untargetable === 0 && this.lastFormDropped != null && this.lastFormChanged != null) {
				if ((this.lastFormDropped - this.lastFormChanged) > FORM_TIMEOUT_MILLIS) {
					this.droppedForms++
				}
			}

			// No form used
			if (this.opoOpoSkills.includes(action.id)) {
				this.formless++
			}
		}
	}

	// Anatman doesn't freeze, it just refreshes every tick, so it's the same as a gain
	private onGain(event: Events['statusApply']): void {
		this.lastFormChanged = event.timestamp

		// Reset forms - we need this to avoid DK spam rotations leaving trailing hooks
		this.resetFormHook()

		this.formHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action'),
			this.onCast,
		)
	}

	private onRemove(event: Events['statusRemove']): void {
		this.lastFormDropped = event.timestamp

		this.resetFormHook()
	}

	private resetFormHook() {
		if (this.formHook != null) {
			this.removeEventHook(this.formHook)
			this.formHook = undefined
		}
	}

	private onPerfectOut(event: Events['statusRemove']): void {
		this.perfectlyFresh = event.timestamp
	}

	private onComplete(): void {
		// Using the wrong form
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FORM_SHIFT.icon,
			content: <Trans id="mnk.forms.suggestions.formless.content">
				Avoid using combo starters outside of <DataLink status="OPO_OPO_FORM"/> as the Form bonus is only activated in the correct form.
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
				icon: this.data.actions.FORM_SHIFT.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.forms.suggestions.reset.content">
					Try not to cancel combos by using <DataLink action="BOOTSHINE"/>, <DataLink action="DRAGON_KICK"/>, or <DataLink action="SHADOW_OF_THE_DESTROYER"/> mid-rotation.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.reset.why">
					<Plural value={this.resetForms} one="# combo was" other="# combos were" /> reset by an Opo-Opo Form skill.
				</Trans>,
			}))
		}

		// Skipping a form
		if (this.skippedForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FORM_SHIFT.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.forms.suggestions.skipped.content">
					Avoid skipping Forms outside of downtime. A skipped GCD could otherwise be used for damage.
				</Trans>,
				why: <Trans id="mnk.forms.suggestions.skipped.why">
					<Plural value={this.skippedForms} one="# form was" other="# forms were" /> skipped by Form Shift unnecessarily.
				</Trans>,
			}))
		}

		// Form timeout
		if (this.droppedForms >= 1) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FORM_SHIFT.icon,
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
