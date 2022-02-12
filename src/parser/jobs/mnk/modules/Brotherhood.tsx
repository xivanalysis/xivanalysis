import {t} from '@lingui/macro'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {Event, Events} from '../../../../event'
import {filter, oneOf} from '../../../core/filter'
import {BLITZ_ACTIONS} from './constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {BlitzEvaluator} from './evaluators/BlitzEvaluator'
import {BrotherhoodTargetsEvaluator} from './evaluators/BrotherhoodTargetsEvaluator'
import {fillActions} from './utilities'

export interface BrotherhoodWindow {
	start: number
	targetsAffected: number
}

export class Brotherhood extends BuffWindow {
	static override debug = true
	static override handle = 'brotherhood'
	static override title = t('mnk.bh.title')`Brotherhood`
	static override displayOrder = DISPLAY_ORDER.BROTHERHOOD

	@dependency globalCooldown!: GlobalCooldown

	buffStatus = this.data.statuses.BROTHERHOOD

	private blitzActions = fillActions(BLITZ_ACTIONS, this.data)
	private brotherhoodWindows: BrotherhoodWindow[] = [];

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
		this.addEvaluator(new BrotherhoodTargetsEvaluator({
			brotherhoodWindows: this.brotherhoodWindows,
		}))
	}

	private buffApplied(event: Events['statusApply']) {
		const brotherhoodWindow = this.brotherhoodWindows.find(value => Math.abs(value.start - event.timestamp) < this.data.statuses.BROTHERHOOD?.duration)
		if (brotherhoodWindow) {
			brotherhoodWindow.targetsAffected += 1
		} else {
			this.brotherhoodWindows.push({start: event.timestamp, targetsAffected: 1})
		}
		this.debug(this.brotherhoodWindows)
	}

}
