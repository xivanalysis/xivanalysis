import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'

// TODO: Figure out how to check if the next Continuation was even usable before the fight ended.
// TODO: Keep track of missed Continuation buffs and log them later down the line in a Rotation table, maybe.
export default class Continuation extends Module {
	static handle = 'continuation'

	@dependency private checklist!: Checklist

	private ripBuffCounter = 0
	private tearBuffCounter = 0
	private gougeBuffCounter = 0
	private ripCounter = 0
	private tearCounter = 0
	private gougeCounter = 0

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCastTrigger)
		this.addHook('applybuff', {by: 'player'}, this.onBuffTrigger)
		this.addHook('complete', this.onComplete)
	}

	private onCastTrigger(event: CastEvent) {
		const id = event.ability.guid
		switch (id) {
			case ACTIONS.JUGULAR_RIP.id:
				this.ripCounter++
				break
			case ACTIONS.ABDOMEN_TEAR.id:
				this.tearCounter++
				break
			case ACTIONS.EYE_GOUGE.id:
				this.gougeCounter++
				break
		}
	}

	private onBuffTrigger(event: BuffEvent) {
		const id = event.ability.guid
		switch (id) {
			case STATUSES.READY_TO_RIP.id:
				this.ripBuffCounter++
				break
			case STATUSES.READY_TO_TEAR.id:
				this.tearBuffCounter++
				break
			case STATUSES.READY_TO_GOUGE.id:
				this.gougeBuffCounter++
				break
		}
	}

	private onComplete() {
		const totalContinuationBuffs = this.ripBuffCounter + this.tearBuffCounter + this.gougeBuffCounter
		const totalContinuationActions = this.ripCounter + this.tearCounter + this.gougeCounter

		this.checklist.add(new Rule({
			name: 'Use a Continuation once per action in the Gnashing Fang combo',
			description: <Trans id="gnb.continuation.checklist.description">
				One <ActionLink {...ACTIONS.CONTINUATION}/> action should be used for each <ActionLink {...ACTIONS.GNASHING_FANG}/> combo action.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="gnb.continuation.checklist.requirement.continuation.name">
						<ActionLink {...ACTIONS.CONTINUATION}/> uses per <ActionLink {...ACTIONS.GNASHING_FANG}/> combo action
					</Trans>,
					value: totalContinuationActions,
					target: totalContinuationBuffs,
				}),
			],
		}))
	}

}
