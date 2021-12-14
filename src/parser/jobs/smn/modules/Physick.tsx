import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Physick extends Analyser {
	static override handle = 'physick'
	static override title = t('smn.physick.title')`Physick`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private phyisckCount = 0

	override initialise() {
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id)
				.action(this.data.actions.SMN_PHYSICK.id)
				.type('action'),
			this.onPhysick
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onPhysick() {
		this.phyisckCount += 1
	}

	private onComplete() {
		if (this.phyisckCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SMN_PHYSICK.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="smn.physick.suggestion.content">
					Do not cast <ActionLink {...ACTIONS.SMN_PHYSICK} /> in group content.
					The heal is too small to justify casting over a damaging GCD.
				</Trans>,
				why: <Trans id="smn.physick.suggestion.why">
					Physick was cast <Plural value={this.phyisckCount} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}

}
