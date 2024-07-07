import {Plural, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Triplecast extends Analyser {
	static override handle = 'triplecast'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private overwrittenTriples = 0

	override initialise() {
		this.addEventHook(filter<Event>().source(this.parser.actor.id).action(this.data.actions.TRIPLECAST.id), this.onTriplecast)
		this.addEventHook('complete', this.onComplete)
	}

	private onTriplecast() {
		if (this.actors.current.hasStatus(this.data.statuses.TRIPLECAST.id)) {
			this.overwrittenTriples++
		}
	}

	private onComplete() {
		// Suggestion not to overwrite Triplecast
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TRIPLECAST.icon,
			content: <Trans id="blm.triplecast.suggestions.overwrote-triplecasts.content">
				You lost at least one instant cast spell by using <DataLink action="TRIPLECAST" /> while the status was already active.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.overwrittenTriples,
			why: <Trans id="blm.triplecast.suggestions.overwrote-triplecasts.why">
				You overwrote <DataLink showIcon={false} status="TRIPLECAST" /> <Plural value={this.overwrittenTriples} one="# time" other="# times" />.
			</Trans>,
		}))
	}
}
