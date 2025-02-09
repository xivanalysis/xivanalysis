import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'

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
		this.checklist.add(new Rule({
			name: <Trans id="rpr.deathsdesign.rule.name">
				Keep <DataLink status="DEATHS_DESIGN"/> up
			</Trans>,
			description: <Trans id="rpr.deathsdesign.rule.description">
				Death's Design increases all damage you deal to the target by 10%. Aim to keep this debuff up at all times.
			</Trans>,

			requirements: [
				new Requirement({
					name: <Trans id="rpr.deathsdesign.requirement.uptime.name"><DataLink status="DEATHS_DESIGN"/> uptime</Trans>,
					percent: this.getUptimePercent(),
				}),
			],
		}))
	}
}
