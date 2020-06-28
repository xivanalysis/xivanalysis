import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event} from 'events'
import Module, {dependency} from 'parser/core/Module'
import Checklist from 'parser/core/modules/Checklist'
import {Requirement, Rule} from 'parser/core/modules/Checklist'
import Death from 'parser/core/modules/Death'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import React from 'react'

const DARKSIDE_MAX_DURATION = 60000
const DARKSIDE_EXTENSION = {
	[ACTIONS.FLOOD_OF_SHADOW.id]: 30000,
	[ACTIONS.EDGE_OF_SHADOW.id]: 30000,
}
const INITIAL_APPLICATION_FORGIVENESS = 2500

export class Darkside extends Module {
	static handle = 'Darkside'

	static title = t('drk.darkside.title')`Darkside`
	@dependency private checklist!: Checklist
	@dependency private death!: Death

	private _currentDuration = 0
	private _downtime = 0
	private _lastEventTime: number | null = null

	protected init() {
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: Object.keys(DARKSIDE_EXTENSION).map(Number)}, this._updateDarkside)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('raise', {to: 'player'}, this._onRaise)
		this.addEventHook('complete', this._onComplete)
	}

	_updateDarkside(event: Event | NormalisedDamageEvent) {
		if (this._lastEventTime === null) {
			// First application - allow up to 1 GCD to apply before counting downtime
			const elapsedTime = event.timestamp - this.parser.fight.start_time
			this._downtime = Math.max(elapsedTime - INITIAL_APPLICATION_FORGIVENESS, 0)
		} else {
			const elapsedTime = event.timestamp - this._lastEventTime
			this._currentDuration -= elapsedTime
			if (this._currentDuration < 0) {
				this._downtime += Math.abs(this._currentDuration)
				this._currentDuration = 0
			}
		}

		if (event.type === 'normaliseddamage') {
			const abilityId = event.ability.guid
			this._currentDuration = Math.min(this._currentDuration + DARKSIDE_EXTENSION[abilityId], DARKSIDE_MAX_DURATION)
			this._lastEventTime = event.timestamp
		}
	}

	_onDeath(event: Event) {
		this._updateDarkside(event)
		this._currentDuration = 0
	}

	_onRaise(event: Event) {
		// So floor time doesn't count against Darkside uptime
		this._lastEventTime = event.timestamp
	}

	_onComplete(event: Event) {
		this._updateDarkside(event)
		const duration = this.parser.currentDuration - this.death.deadTime
		const uptime = ((duration - this._downtime) / duration) * 100
		this.checklist.add(new Rule({
			name: 'Keep Darkside up',
			description: <Trans id="drk.darkside.uptime.why">
				Darkside is gained by using <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/> or <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/> and provides you with a 10% damage increase.  As such, it is a significant part of a DRK's personal DPS.  Do your best not to let it drop, and recover it as quickly as possible if it does.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="drk.darkside.uptime">Darkside Uptime</Trans>,
					percent: () => uptime,
				}),
			],
			target: 99,
		}))
	}
}
