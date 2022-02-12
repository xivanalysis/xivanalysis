import {t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {ActionRoot} from 'data/ACTIONS'
import {StatusRoot} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {PlayersBuffedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/PlayersBuffedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import React from 'react'
import {BLITZ_ACTIONS} from './constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {BlitzEvaluator} from './evaluators/BlitzEvaluator'
import {fillActions} from './utilities'

export interface BrotherhoodBuff {
	start: number
	target: string
}

export class Brotherhood extends BuffWindow {
	static override debug = true
	static override handle = 'brotherhood'
	static override title = t('mnk.bh.title')`Brotherhood`
	static override displayOrder = DISPLAY_ORDER.BROTHERHOOD

	@dependency globalCooldown!: GlobalCooldown

	buffStatus = this.data.statuses.BROTHERHOOD

	private blitzActions = fillActions(BLITZ_ACTIONS, this.data)
	private brotherhoodWindows: BrotherhoodBuff[] = []
	private brotherhood : StatusRoot['BROTHERHOOD'] = this.data.statuses.BROTHERHOOD

	override initialise() {
		super.initialise()

		const playerCharacters = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)

		this.addEventHook(filter<Event>()
			.type('statusApply')
			.status(this.data.statuses.BROTHERHOOD.id)
			.source(this.parser.actor.id)
			.target(oneOf(playerCharacters)),
		this.buffApplied)

		this.addEvaluator(new BlitzEvaluator({
			blitzActions: this.blitzActions,
			excepted: 1,
		}))
		this.addEvaluator(new PlayersBuffedEvaluator({
			affectedPlayers: this.affectedPlayers.bind(this),
			suggestionContent: <Trans id="mnk.bh.playersbuffed.suggestion.content">
				To maximise raid dps, make sure <DataLink action="BROTHERHOOD"/> hits all party members.
			</Trans>,
			suggestionIcon: this.data.actions.BROTHERHOOD.icon,
			status: this.brotherhood.id,
		}))
	}

	private affectedPlayers(window: HistoryEntry<EvaluatedAction[]>): number {
		return this.brotherhoodWindows.filter(value => Math.abs(window.start - value.start) < this.brotherhood.duration).length
	}

	private buffApplied(event: Events['statusApply']) {
		this.brotherhoodWindows.push({start: event.timestamp, target: event.target})
		this.debug(this.brotherhoodWindows)
	}

}
