import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {getBasePotency} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Revolution extends Analyser {
	static override handle = 'cr'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private revolutions: number = 0

	override initialise(): void {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.CELESTIAL_REVOLUTION.id),
			() => this.revolutions++)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete(): void {
		if (this.revolutions > 0) {
			const lowerBound = this.revolutions * (getBasePotency(this.data.actions.ELIXIR_FIELD) - getBasePotency(this.data.actions.CELESTIAL_REVOLUTION))
			const upperBound = this.revolutions * (getBasePotency(this.data.actions.RISING_PHOENIX) - getBasePotency(this.data.actions.CELESTIAL_REVOLUTION))
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.CELESTIAL_REVOLUTION.icon,
				content: <Trans id="mnk.cr.suggestions.content">
					Avoid using <ActionLink action="CELESTIAL_REVOLUTION"/> over <ActionLink action="ELIXIR_FIELD"/> or <ActionLink action="RISING_PHOENIX"/> as they have higher potency even for a single target.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="mnk.cr.suggestions.why">
					{lowerBound} - {upperBound} potency lost due to <Plural value={this.revolutions} one="# use" other="# uses"/> of <ActionLink action="CELESTIAL_REVOLUTION"/>.
				</Trans>,
			}))
		}
	}
}
