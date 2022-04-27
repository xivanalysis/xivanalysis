import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SURGING_TEMPEST_GENERATORS: ActionKey[] = [
	'MYTHRIL_TEMPEST',
	'STORMS_EYE',
	'INNER_RELEASE',
]
const SURGING_TEMPEST_GENERATION_AMOUNT = 30
// Surging Tempest Extension
const SURGING_TEMPEST_EXTENSION_AMOUNT = 10

const TEMPEST_MAX = 60000

const EYE_BUFFER = 7500
const PATH_LOST_GAUGE = 10

const SUGGESTION_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export class SurgingTempest extends CoreGauge {
	static override handle = 'surgingtempest'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	override initialise(): void {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.matchActionId(SURGING_TEMPEST_GENERATORS)),
			this.extendSurgingTempest
		)
		this.addEventHook('complete', this.onComplete)
	}

	private surgingTempest = this.add(new TimerGauge({
		maximum: TEMPEST_MAX,
	}))

	private earlyEyes = 0

	private onSurge(event: Events['action' | 'combo']) {

		if (this.surgingTempest.remaining > SURGING_TEMPEST_EARLY_REFRESH_GRACE) {
			this.earlyRefreshCount++
		}
		if (event.action === this.data.actions.INNER_RELEASE.id) {
			this.surgingTempest.extend(SURGING_TEMPEST_EXTENSION_AMOUNT, true)
		} else {
			this.surgingTempest.extend(SURGING_TEMPEST_GENERATION_AMOUNT)
		}
	}

	onComplete(): void {
		this.checklist.add(new Rule({
			name: <Trans id="war.surgingtempest.checklist.name">Keep Surging Tempest Up</Trans>,
			description: <Trans id="war.surgingtempest.checklist.description">Surging Tempest increases your damage by 10%, a substantial part of your damage.</Trans>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="war.surgingtempest.checklist.uptime"><DataLink status="SURGING_TEMPEST"/> uptime</Trans>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))
		this.suggestions.add(new TieredSuggestion({
			content: <Trans id="war.surgingtempest.suggestions.early.content">
			Avoid using <DataLink action="STORMS_EYE"/> more than {EYE_BUFFER / 1000} seconds before it expires, as it generates less Beast Gauge than <DataLink action="STORMS_PATH"/> which can cost you uses of your gauge consumers.
			</Trans>,
			why: <Trans id="war.surgingtempest.suggestions.early.why">
				You lost {this.earlyRefreshCount * STORMS_EYE_LOST_GAUGE} Beast Gauge over the course of the fight due to early refreshes.
			</Trans>,
			icon: this.data.actions.STORMS_EYE.icon,
			value: this.earlyRefreshCount,
			tiers: SUGGESTION_TIERS,
		}))
	}

	getUptimePercent(): number {
		const statusUptime = this.statuses.getUptime('SURGING_TEMPEST', this.actors.friends)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}
