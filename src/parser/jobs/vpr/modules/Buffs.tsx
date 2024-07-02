import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Buffs extends Analyser {
	static override handle = 'Buffs'
	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private statuses!: Statuses
	@dependency private invulnerability!: Invulnerability
	@dependency private data!: Data

	override initialise() {
		super.initialise()

		this.addEventHook('complete', this.onComplete)
	}

	onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="vpr.buffs.checklist.name"> Keep {this.data.statuses.HUNTERS_INSTINCT.name} and {this.data.statuses.SWIFTSCALED.name} up </Trans>,
			displayOrder: DISPLAY_ORDER.BUFFS,
			description: <Trans id= "vpr.buffs.description"> {this.data.statuses.HUNTERS_INSTINCT.name} and {this.data.statuses.SWIFTSCALED.name} increases your damage by 10% and speed by 15%. Both buffs are key part of Viper's damage.</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id = "vpr.buffs.checklist.requirement.huntersinstinct.name"> <DataLink status="HUNTERS_INSTINCT"/> uptime </Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.HUNTERS_INSTINCT),
				}),

				new Requirement({
					name: <Trans id= "vpr.buffs.checklist.requirement.swiftscaled.name"> <DataLink status="SWIFTSCALED"/> uptime </Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.SWIFTSCALED),
				}),
			],
		}))
	}

	getUptimePercent(Status: Status) {
		const statusUptime = this.statuses.getUptime(Status, this.actors.current)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusUptime / fightUptime) * 100
	}
}
