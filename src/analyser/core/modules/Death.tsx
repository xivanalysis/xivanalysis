import {Plural, Trans} from '@lingui/react'
import {DutyState, Events} from '@xivanalysis/parser-core'
import {EventTypes} from 'analyser/Analyser'
import {dependency} from 'analyser/dependency'
import {Module} from 'analyser/Module'
import ACTIONS from 'data/ACTIONS'
import React from 'react'
import {Severity, Suggestion, Suggestions} from './Suggestions'

export class Death extends Module {
	static handle = 'death'
	@dependency private suggestions!: Suggestions

	private count = 0
	// private deadTime = 0
	// private timestamp?: number

	protected init() {
		this.addHook(Events.Type.DEATH, {targetId: this.analyser.actor.id}, this.onDeath)
		// TODO: Hook end of death (raise, prepare, etc)
		this.addHook(
			Events.Type.UPDATE_DUTY,
			{changes: {state: DutyState.RESETTING}},
			this.onWipe,
		)
		this.addHook(EventTypes.COMPLETE, this.onComplete)
	}

	private onDeath(event: Events.Death) {
		if (!this.shouldCountDeath()) { return }

		this.count++
		// this.timestamp = event.timestamp
	}

	private onWipe(event: Events.UpdateDuty) {
		// Deaths cased by a party wipe are pretty meaningless to complain about
		this.count = Math.max(this.count - 1, 0)
	}

	private onComplete() {
		// TODO: Timeline :nauseated_face:

		if (this.count <= 0) {
			return
		}

		this.suggestions.add(new Suggestion({
			icon: ACTIONS.RAISE.icon,
			content: <Trans id="core.deaths.content">
				Don't die. Between downtime, lost gauge resources, and resurrection debuffs, dying is absolutely <em>crippling</em> to damage output.
			</Trans>,
			severity: Severity.MORBID,
			why: <Plural
				id="core.deaths.why"
				value={this.count}
				_1="# death"
				other="# deaths"
			/>,
		}))
	}

	/**
	 * If a death at the time of calling should be considered the player's fault.
	 * Fights that force a player death (*cough*ucob*cough*) should return `false`
	 * from this function at the time of the forced death.
	 */
	protected shouldCountDeath() {
		return true
	}
}
