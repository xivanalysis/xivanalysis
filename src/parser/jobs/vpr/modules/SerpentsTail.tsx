import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import DISPLAY_ORDER from 'parser/jobs/vpr/modules/DISPLAY_ORDER'
import React from 'react'

const PERFECTIO = 100 // 100% perfect, RPR would be proud
export class SerpentsTail extends Analyser {
	static override handle = 'SerpentsTail'
	static override displayOrder = DISPLAY_ORDER.SERPENTS_TAIL
	@dependency private checklist!: Checklist
	@dependency private data!: Data

	private tailsReady = 0
	private tailsDone = 0

	TailGrantors = [
		//Single Target GCDs grant Death Rattle
		this.data.actions.HINDSBANE_FANG.id,
		this.data.actions.HINDSTING_STRIKE.id,
		this.data.actions.FLANKSBANE_FANG.id,
		this.data.actions.FLANKSTING_STRIKE.id,

		//AOE GCDs grant last lash
		this.data.actions.JAGGED_MAW.id,
		this.data.actions.BLOODIED_MAW.id,

		//Generations leave behind legacies
		this.data.actions.FIRST_GENERATION.id,
		this.data.actions.SECOND_GENERATION.id,
		this.data.actions.THIRD_GENERATION.id,
		this.data.actions.FOURTH_GENERATION.id,
	]

	TailSpenders = [
		this.data.actions.DEATH_RATTLE.id,
		this.data.actions.LAST_LASH.id,
		this.data.actions.FIRST_LEGACY.id,
		this.data.actions.SECOND_LEGACY.id,
		this.data.actions.THIRD_LEGACY.id,
		this.data.actions.FOURTH_LEGACY.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.TailGrantors)),
			this.onTailGrantor,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.TailSpenders)),
			this.onTailSpenders,
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onTailGrantor() {
		this.tailsReady++
	}

	private onTailSpenders() {
		this.tailsDone++
	}

	private onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id = "VPR.serpentstail.waste.name"> Use your <DataLink action="SERPENTS_TAIL"/> follow-ups </Trans>,
			displayOrder: DISPLAY_ORDER.SERPENTS_TAIL,
			target: PERFECTIO,
			description: <Trans id="vpr.serpentstail.waste.content">
				Using <DataLink action = "HINDSBANE_FANG"/>, <DataLink action="HINDSTING_STRIKE"/>, <DataLink action="FLANKSBANE_FANG"/> or <DataLink action="FLANKSTING_STRIKE"/> grant <DataLink action="DEATH_RATTLE"/>.
				<br/>
				Using <DataLink action = "JAGGED_MAW"/> and <DataLink action="BLOODIED_MAW"/> grant <DataLink action="LAST_LASH"/>.
				<br/>
				Using the Generation skills under <DataLink action="REAWAKEN"/> grants Legacy follow up skills.
				<br/>
				These skills are important to a Viper's damage and must be used immediately after the skill that grants them by using <DataLink action="SERPENTS_TAIL">.</DataLink>
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="vpr.serpentstail.checklist.requirement.waste.name">
						Follow up your GCD combo finishers and Generation skills with Serpent's Tail skills
					</Trans>,
					value: this.tailsDone,
					target: this.tailsReady,
				}),
			],
		}))
	}
}
