import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const STORMS_EYE_BUFFER = 7000

export class StormsEye extends Analyser {
	static override handle = 'stormseye'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	private earlyEyes: number = 0
	private totalEyes: number = 0
	private lastRefresh: number = this.parser.pull.timestamp

	override initialise(): void {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.STORMS_EYE.id), this.onGain)
		this.addEventHook('complete', this.onComplete)
	}

	onGain(event: Events['statusApply']): void {
		this.lastRefresh = event.timestamp

		if (this.totalEyes < 2) {
			this.totalEyes++
			return
		}

		if (this.parser.patch.before('5.3')) {
			const remaining = event.timestamp - this.lastRefresh
			if (remaining < this.data.statuses.STORMS_EYE.duration - STORMS_EYE_BUFFER) {
				this.earlyEyes++
			}
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

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.STORMS_EYE.icon,
			content: <Trans id="war.suggestions.stormseye.content">
					Avoid refreshing <DataLink showIcon={false} status="STORMS_EYE"/> significantly before its expiration as it may be costing you additional uses of <DataLink action="STORMS_PATH"/>.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
			},
			value: this.earlyEyes,
			why: <Trans id="war.suggestions.stormseye.why">
				{this.earlyEyes} reapplications that were {STORMS_EYE_BUFFER / 1000} or more seconds before expiration.
			</Trans>,
		}))
	}

	getUptimePercent(): number {
		const statusUptime = this.statuses.getUptime('STORMS_EYE', this.actors.friends)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}
