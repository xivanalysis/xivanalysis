import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class Physick extends Module {
	static handle = 'physick'
	static title = t('smn.physick.title')`Physick`

	@dependency private suggestions!: Suggestions

	private phyisckCount = 0

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.PHYSICK.id}, this.onPhysick)
		this.addHook('complete', this.onComplete)
	}

	private onPhysick(event: CastEvent) {
		this.phyisckCount += 1
	}

	private onComplete() {
		if (this.phyisckCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.PHYSICK.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="smn.physick.suggestion.content">
					Do not cast <ActionLink {...ACTIONS.PHYSICK} /> in group content.
					The heal is too small to justify casting over a damaging GCD.
				</Trans>,
				why: <Trans id="smn.physick.suggestion.why">
					Physick was cast <Plural value={this.phyisckCount} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}

}
