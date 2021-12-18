import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'

const UPTIME_SEVERITY = {
	90: TARGET.WARN,
	95: TARGET.SUCCESS,
}

export class DeathsDesign extends Analyser {
	static override handle = 'deathsdesign'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	private getUptimePercent() {
		const uptime = this.statuses.getUptime(this.data.statuses.DEATHS_DESIGN, this.actors.foes)
		const duration = this.parser.pull.duration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (uptime / duration) * 100
	}

	private onComplete() {
		this.checklist.add(new TieredRule({
			name: <Trans id="rpr.deathsdesign.rule.name">Keep <DataLink status="DEATHS_DESIGN"/> up</Trans>,
			description: <Trans id="rpr.deathsdesign.rule.description">
				Death's Design increases all damage you deal to the target by 10%. Aim to keep this debuff up at all times.
			</Trans>,
			tiers: UPTIME_SEVERITY,
			requirements: [
				new Requirement({
					name: <Trans id="rpr.deathsdesign.requirement.uptime.name"><DataLink status="DEATHS_DESIGN"/> uptime</Trans>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))
	}
}
