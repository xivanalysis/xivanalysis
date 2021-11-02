import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class ArcanaUndrawUsage extends Analyser {
	static override handle = 'arcanaundraws'
	private _badUndraws: number = 0

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.UNDRAW.id), this._onCast)
		this.addEventHook('complete', this._onComplete)
		this._badUndraws = 0
	}

	_onCast(event: Events['action']) {
		this._saveIfBadUndraw(event)
	}

	_saveIfBadUndraw(event: Events['action']) {
		const actionId = event.action

		// It's a OGCD Arcana Undraw. GET IT.
		if (actionId === this.data.actions.UNDRAW.id) {
			this._badUndraws += 1
		}
	}

	_onComplete() {
		if (this._badUndraws > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.UNDRAW.icon,
				content: <Trans id="ast.arcana-undraw-usage.suggestions.content" >
						Due to Draw starting its cooldown the moment it's used, there is no longer any reason to <DataLink action="UNDRAW" /> instead of playing it or converting it with <DataLink action="MINOR_ARCANA" />.
				</Trans>,
				severity: SEVERITY.MAJOR,
				value: this._badUndraws,
				why: <Trans id="ast.arcana-undraw-usage.suggestions.why">
					<Plural value={this._badUndraws} one="# instance" other="# instances" /> of using undraw.
				</Trans>,
			}))
		}
	}
}
