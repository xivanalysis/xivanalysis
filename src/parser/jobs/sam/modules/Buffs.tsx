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
			name: <Trans id="sam.buffs.checklist.name"> Keep {this.data.statuses.FUKA.name} and {this.data.statuses.FUGETSU.name} up </Trans>,
			description: <Trans id= "sam.buffs.description"> {this.data.statuses.FUGETSU.name} and {this.data.statuses.FUKA.name} increases your damage and speed by 13%. Both buffs are key part of Samurai's damage.</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id = "sam.buffs.checklist.requirement.fugetsu.name"> <DataLink status="FUGETSU"/> uptime </Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.FUGETSU),
				}),

				new Requirement({
					name: <Trans id= "sam.buffs.checklist.requirement.fuka.name"> <DataLink status="FUKA"/> uptime </Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.FUKA),
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
