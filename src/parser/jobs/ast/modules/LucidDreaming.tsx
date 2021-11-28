import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

const WASTED_USES_MAX_MEDIUM = 2

export default class LucidDreaming extends Analyser {
	static override handle = 'lucid'
	static override dependencies = [
		'suggestions',
	]

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private lastUse = 0
	private uses = 0
	private totalHeld = 0

	override initialise() {

		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.LUCID_DREAMING.id), this._onCastLucid)
		this.addEventHook('complete', this._onComplete)
	}

	_onCastLucid(event: Events['action']) {
		this.uses++

		if (this.lastUse === 0) { this.lastUse = this.parser.pull.timestamp }

		let _held = 0

		if (this.uses === 1) {
			// The first use, take holding as from the first minute of the fight
			_held = event.timestamp - this.parser.pull.timestamp
		} else {
			// Take holding as from the time it comes off cooldown
			_held = event.timestamp - this.lastUse - this.data.actions.LUCID_DREAMING.cooldown
		}

		if (_held > 0) {
			this.totalHeld += _held
		}
		//update the last use
		this.lastUse = event.timestamp
	}

	_onComplete() {
		//uses missed reported in 1 decimal
		const holdDuration = this.uses === 0 ? this.parser.currentDuration : this.totalHeld
		const _usesMissed = Math.floor(holdDuration / this.data.actions.LUCID_DREAMING.cooldown)

		if (_usesMissed > 1 || this.uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.LUCID_DREAMING.icon,
				content: <Fragment>
					<Trans id="ast.lucid-dreaming.suggestion.content">
					Keep <DataLink action="LUCID_DREAMING" /> on cooldown for better MP management.
					</Trans>
				</Fragment>,
				severity: this.uses === 0 || _usesMissed > WASTED_USES_MAX_MEDIUM ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Fragment>
					<Trans id="ast.lucid-dreaming.suggestion.why">
						<Plural value={_usesMissed} one="# use" other="# uses" /> of Lucid Dreaming were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
					</Trans>
				</Fragment>,
			}))
		}

	}

}
