import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import { filter } from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ActionWindow, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class CorpsaCorps extends ActionWindow {
	static override handle = 'cac'
	static override title = t('rdm.cac.title')`Corps-a-Corps`

	@dependency globalCooldown!: GlobalCooldown

	override initialise() {
		super.initialise()

		this.trackOnlyActions([this.data.actions.CORPS_A_CORPS.id])

		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(this.data.actions.MANAFICATION.id),
			this.onManafication)

		const windowName = <ActionLink action="MANAFICATION" showIcon={false}/>

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.CORPS_A_CORPS,
					expectedPerWindow: 3,
				}
			],
			suggestionIcon: this.data.actions.CORPS_A_CORPS.icon,
			suggestionContent: <Trans id="rdm.cac.suggestions.trackedActions.content">
				Three uses of <ActionLink action="CORPS_A_CORPS"/> should occur between every <ActionLink action="MANAFICATION"/>.
			</Trans>,
			suggestionWindowName: windowName,
			severityTiers: {
				1: SEVERITY.MAJOR,
				2: SEVERITY.MEDIUM
			},
		}))
	}

	private onManafication(event: Events['action']) {
		this.onWindowEnd(event.timestamp)
		this.onWindowStart(event.timestamp)
	}
}
