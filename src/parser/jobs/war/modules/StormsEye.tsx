import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'

export class StormsEye extends Analyser {
	static override handle = 'stormseye'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	private totalEyes: number = 0

	override initialise(): void {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.STORMS_EYE.id), this.onGain)
		this.addEventHook('complete', this.onComplete)
	}

	onGain(): void {
		if (this.totalEyes < 2) {
			this.totalEyes++
			return
		}
	}

	onComplete(): void {
		this.checklist.add(new Rule({
			name: <Trans id="war.stormseye.checklist.name">Keep Storm's Eye Up</Trans>,
			description: <Trans id="war.stormseye.checklist.description">Storm's Eye increases your damage by 10%, a substantial part of a Warrior's damage.</Trans>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="war.stormseye.checklist.uptime"><DataLink status="STORMS_EYE"/> uptime</Trans>,
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
