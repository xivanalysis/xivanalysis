import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

//Surging Tempest Generation
const SURGING_TEMPEST_GENERATORS: ActionKey[] = [
	'MYTHRIL_TEMPEST',
	'STORMS_EYE',
]
const SURGING_TEMPEST_GENERATION_AMOUNT = 30
// Surging Tempest Extension
const SURGING_TEMPEST_EXTENDERS: ActionKey[] = ['INNER_RELEASE']
const SURGING_TEMPEST_EXTENSION_AMOUNT = 10

const SURGING_TEMPEST_EARLY_REFRESH_GRACE = 7.5
const STORMS_EYE_LOST_GAUGE = 10
//TODO: Discuss with acc to select correct tier breakpoints
const SUGGESTION_TIERS = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export class SurgingTempest extends Analyser {
	static override handle = 'surgingtempest'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	override initialise(): void {
		this.addEventHook('complete', this.onComplete)
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
	}

	getUptimePercent(): number {
		const statusUptime = this.statuses.getUptime('SURGING_TEMPEST', this.actors.friends)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}

export class StormsEye extends CoreGauge {
	static override handle = 'stormseye'

	@dependency private suggestions!: Suggestions

	private surgingTempest = this.add(new TimerGauge({
		maximum: 60,
	}))

	private earlyRefreshCount = 0

	override initialise() {
		super.initialise()
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.matchActionId(SURGING_TEMPEST_GENERATORS)),
			(_) => this.extendSurgingTempest(SURGING_TEMPEST_GENERATION_AMOUNT)
		)

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.matchActionId(SURGING_TEMPEST_EXTENDERS)),
			(_) => this.extendSurgingTempest(SURGING_TEMPEST_EXTENSION_AMOUNT, true)
		)
		this.addEventHook('complete', this.onComplete)
	}

	private extendSurgingTempest(amount: number, onlyIfRunning ?: boolean) {
		onlyIfRunning === undefined ? false : onlyIfRunning

		if (this.surgingTempest.remaining > SURGING_TEMPEST_EARLY_REFRESH_GRACE) {
			this.earlyRefreshCount++
		}

		if ((this.surgingTempest.expired || this.surgingTempest.paused) && !onlyIfRunning) {
			this.surgingTempest.start()
		}
		this.surgingTempest.extend(amount, onlyIfRunning)
	}

	private onComplete() {
		if (this.earlyRefreshCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				content: <Trans id="war.stormseye.suggestions.overwrite.content">
				Avoid refreshing <DataLink status="SURGING_TEMPEST" /> too early
				</Trans>,
				why: <Trans id="war.stormseye.suggestions.overwrite.why">
					You lost {this.earlyRefreshCount * STORMS_EYE_LOST_GAUGE} Beast Gauge over the course of the fight due to early refreshes.
				</Trans>,
				icon: this.data.actions.STORMS_EYE.icon,
				value: this.earlyRefreshCount,
				tiers: SUGGESTION_TIERS,
			}))
		}
	}
}
