import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'

const RELEVANT_ACTIONS = [ACTIONS.JUGULAR_RIP.id, ACTIONS.ABDOMEN_TEAR.id, ACTIONS.EYE_GOUGE.id]
const RELEVANT_STATUSES = [STATUSES.READY_TO_RIP.id, STATUSES.READY_TO_TEAR.id, STATUSES.READY_TO_GOUGE.id]

export default class Continuation extends Module {
	static handle = 'continuation'

	@dependency private checklist!: Checklist

	private buffs = 0
	private actions = 0

	protected init() {
		this.addHook('cast',
			{
				by: 'player',
				abilityId: RELEVANT_ACTIONS,
			},
			() => this.actions++)
		this.addHook('applybuff',
			{
				by: 'player',
				abilityId: RELEVANT_STATUSES,
			},
			() => this.buffs++)
		this.addHook('complete', this.onComplete)
	}

	private onComplete() {

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
					value: this.actions,
					target: this.buffs,
				}),
			],
		}))
	}

}
