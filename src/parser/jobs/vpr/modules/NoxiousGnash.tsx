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
import DISPLAY_ORDER from './DISPLAY_ORDER'

const SEVERITIES = {
	95: TARGET.SUCCESS,
}

// This Module is a temporary stopgap to get ABCs of viper working. Vipers will want more detailed analysis in the future.
export class NoxiousGnash extends Analyser {
	static override handle = 'noxiousgnash'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	private getUptimePercent() {
		const uptime = this.statuses.getUptime(this.data.statuses.NOXIOUS_GNASH, this.actors.foes)
		const duration = this.parser.pull.duration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (uptime / duration) * 100
	}

	private onComplete() {
		this.checklist.add(new TieredRule({
			displayOrder: DISPLAY_ORDER.NOXIOUS_GNASH,
			name: <Trans id="vpr.noxiousgnash.rule.name">
				Keep <DataLink status="NOXIOUS_GNASH"/> up
			</Trans>,
			description: <Trans id="vpr.noxiousgnash.rule.description">
				<DataLink status="NOXIOUS_GNASH"/>increases all damage you deal to the target by 10%. Aim to keep this debuff up at all times.
			</Trans>,
			tiers: SEVERITIES,
			requirements: [
				new Requirement({
					name: <Trans id="vpr.noxiousgnash.requirement.uptime.name"><DataLink status="NOXIOUS_GNASH"/> uptime</Trans>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))
	}
}
