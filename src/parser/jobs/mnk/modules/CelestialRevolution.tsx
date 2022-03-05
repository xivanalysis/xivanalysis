import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class CelestialRevolution extends Analyser {
	static override handle = 'celestialRevolution'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private count: number = 0

	override initialise(): void {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.CELESTIAL_REVOLUTION.id), () => this.count++)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete(): void {
		if (this.count > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.CELESTIAL_REVOLUTION.icon,
				content: <Trans id="mnk.cr.suggestions.content">
					Avoid using <ActionLink action="CELESTIAL_REVOLUTION"/> over either <ActionLink action="ELIXIR_FIELD"/> or <ActionLink action="RISING_PHOENIX"/>.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="mnk.cr.suggestions.why">
					<ActionLink action="CELESTIAL_REVOLUTION"/> was used <Plural value={this.count} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}
