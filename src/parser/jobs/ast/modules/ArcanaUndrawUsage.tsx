import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class ArcanaUndrawUsage extends Analyser {
	static override handle = 'arcanaundraws'
	private undraws: number = 0

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.UNDRAW.id), this.onUndraw)
		this.addEventHook('complete', this.onComplete)
	}

	private onUndraw() {
		this.undraws += 1
	}

	private onComplete() {
		if (this.undraws > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.UNDRAW.icon,
				content: <Trans id="ast.arcana-undraw-usage.suggestions.content" >
						Due to Draw starting its cooldown the moment it's used, there is no longer any reason to <DataLink action="UNDRAW" /> instead of playing it or directly overwriting it with <DataLink action="DRAW" />.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="ast.arcana-undraw-usage.suggestions.why">
					<Plural value={this.undraws} one="# instance" other="# instances" /> of using undraw.
				</Trans>,
			}))
		}
	}
}
