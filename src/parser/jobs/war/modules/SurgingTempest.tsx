import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

type GaugeModifier = Partial<Record<Event['type'], number>>

const SURGE_MAX = 60000

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

	private surgingTempest = this.add(new TimerGauge({
		maximum: SURGE_MAX,
	}))

	private surgeModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.STORMS_EYE.id, {combo: 30}],
		[this.data.actions.INNER_RELEASE.id, {action: 15}],
	])

	private earlyEyes = 0

	override initialise(): void {
		super.initialise()

		const surgeActions = Array.from(this.surgeModifiers.keys())

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type(oneOf(['action', 'combo']))
				.action(oneOf(surgeActions)),
			this.onSurge
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onSurge(event: Events['action' | 'combo']) {
		const modifier = this.surgeModifiers.get(event.action)
		let isGenerator = true

		switch (event.action) {
		case this.data.actions.INNER_RELEASE.id:
			isGenerator = false

		// eslint-disable-next-line no-fallthrough
		case this.data.actions.STORMS_EYE.id:
			if (isGenerator && this.surgingTempest.remaining > EYE_BUFFER) {
				this.earlyEyes++
			}

			if (modifier != null) {
				const amount = modifier[event.type] ?? 0
				this.surgingTempest.extend(amount, isGenerator)
			}
			break
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
				You lost {this.earlyEyes * PATH_LOST_GAUGE} Beast Gauge over the course of the fight due to early refreshes.
			</Trans>,
			icon: this.data.actions.STORMS_EYE.icon,
			value: this.earlyEyes,
			tiers: SUGGESTION_TIERS,
		}))
	}

	getUptimePercent(): number {
		const statusUptime = this.statuses.getUptime('SURGING_TEMPEST', this.actors.friends)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}
