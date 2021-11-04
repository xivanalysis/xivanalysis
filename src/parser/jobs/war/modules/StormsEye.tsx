import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module, {dependency} from 'parser/core/Module'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'

export default class StormsEye extends Module {
	static override handle = 'stormseye'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	private totalEyes: number = 0

	protected override init(): void {
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.STORMS_EYE.id}, this.onGain)
		this.addEventHook('refreshbuff', {by: 'player', abilityId:  STATUSES.STORMS_EYE.id}, this.onGain)
		this.addEventHook('complete', this.onComplete)
	}

	onGain(): void {
		this.totalEyes++

		if (this.totalEyes < 2) {
			return
		}
	}

	onComplete(): void {
		this.checklist.add(new Rule({
			name: <Trans id="war.stormseye.checklist.name">Keep Storm's Eye Up</Trans>,
			description: <Trans id="war.stormseye.checklist.description">Storm's Eye increases your damage by 10%, it is a substantial part of a Warrior's damage.</Trans>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="war.stormseye.checklist.uptime"><ActionLink {...ACTIONS.STORMS_EYE} /> uptime</Trans>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))
	}

	getUptimePercent(): number {
		const statusUptime = this.statuses.getUptime('STORMS_EYE', this.actors.friends)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}
