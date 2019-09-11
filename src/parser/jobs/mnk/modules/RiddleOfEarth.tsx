import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import {BuffEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

class Riddle {
	active: boolean = false
	clean: boolean = false
	start: number
	end?: number

	constructor(start: number) {
		this.start = start
	}
}

export default class RiddleOfEarth extends Module {
	static handle = 'riddleofearth'
	static title = t('mnk.roe.title')`Riddle of Earth`

	@dependency private suggestions!: Suggestions

	private history: Riddle[] = []
	private riddle?: Riddle

	protected init(): void {
		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.RIDDLE_OF_EARTH.id}, this.onGain)
		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.EARTHS_REPLY.id}, this.onReply)
		this.addHook('removebuff', {to: 'player', abilityId: STATUSES.RIDDLE_OF_EARTH.id}, this.onDrop)

		this.addHook('complete', this.onComplete)
	}

	private onGain(event: BuffEvent): void {
		this.riddle = new Riddle(event.timestamp)
		this.riddle.active = true
	}

	private onReply(event: BuffEvent): void {
		if (this.riddle && this.riddle.active) {
			this.riddle.clean = true
		}
	}

	private onDrop(event: BuffEvent): void {
		this.stopAndSave(event.timestamp)
	}

	private onComplete(): void {
		// Close up rushed RoE
		if (this.riddle && this.riddle.active) {
			this.stopAndSave()
		}

		// Count missed saves
		const missedEarth = this.history.filter(earth => !earth.clean).length

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RIDDLE_OF_EARTH.icon,
			content: <Trans id="mnk.roe.suggestions.missed.content">
				Avoid using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> when you won't take any damage.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
			},
			value: missedEarth,
			why: <Trans id="mnk.roe.suggestions.missed.why">
				<ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> was used <Plural value={missedEarth} one="# time" other="# times" /> without triggering <StatusLink {...STATUSES.EARTHS_REPLY} />.
			</Trans>,
		}))
	}

	private stopAndSave(endTime: number = this.parser.currentTimestamp): void {
		if (this.riddle && this.riddle.active) {
			this.history.push({...this.riddle, active: false, end: endTime})
		}
	}
}
