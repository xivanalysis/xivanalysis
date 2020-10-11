import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const STORMS_EYE_BUFFER = 7000

export default class StormsEye extends Module {
	static handle = 'stormseye'

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private entityStatuses!: EntityStatuses
	@dependency private invuln!: Invulnerability
	@dependency private suggestions!: Suggestions

	private earlyEyes: number = 0
	private totalEyes: number = 0
	private lastRefresh: number = this.parser.fight.start_time

	protected init(): void {
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.STORMS_EYE.id}, this.onGain)
		this.addEventHook('refreshbuff', {by: 'player', abilityId:  STATUSES.STORMS_EYE.id}, this.onGain)
		this.addEventHook('complete', this.onComplete)
	}

	onGain(event: BuffEvent): void {
		this.lastRefresh = event.timestamp
		this.totalEyes++

		if (this.totalEyes < 2) {
			return
		}

		if (this.parser.patch.before('5.3')) {
			const remaining = event.timestamp - this.lastRefresh
			if (remaining < STATUSES.STORMS_EYE.duration - STORMS_EYE_BUFFER) {
				this.earlyEyes++
			}
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

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.STORMS_EYE.icon,
			content: <Trans id="war.suggestions.stormseye.content">
					Avoid refreshing {ACTIONS.STORMS_EYE.name} significantly before its expiration -- That might be making you possibly lose <ActionLink {...ACTIONS.STORMS_PATH} /> uses.
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
		const statusUptime = this.entityStatuses.getStatusUptime(STATUSES.STORMS_EYE.id, this.combatants.getEntities())
		const fightUptime = this.parser.currentDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
