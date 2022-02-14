import {t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {StatusRoot} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {PlayersBuffedEvaluator} from './evaluators/PlayersBuffedEvaluator'

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

	private brotherhoodBuffs: BrotherhoodBuff[] = []
	private brotherhood: StatusRoot['BROTHERHOOD'] = this.data.statuses.BROTHERHOOD

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

		this.addEvaluator(new PlayersBuffedEvaluator({
			affectedPlayers: this.affectedPlayers.bind(this),
			suggestionContent: <Trans id="mnk.bh.playersbuffed.content">
				To maximise raid dps, make sure <DataLink action="BROTHERHOOD"/> hits all party members.
			</Trans>,
			suggestionIcon: this.data.actions.BROTHERHOOD.icon,
			status: this.brotherhood.id,
		}))
	}

	private affectedPlayers(window: HistoryEntry<EvaluatedAction[]>): number {
		return this.brotherhoodBuffs.filter(value => Math.abs(window.start - value.start) < this.brotherhood.duration).length
	}

	private buffApplied(event: Events['statusApply']) {
		this.brotherhoodBuffs.push({start: event.timestamp, target: event.target})
	}

}
