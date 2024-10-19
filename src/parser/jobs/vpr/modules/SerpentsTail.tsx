import {Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
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

	private deathRattleReadies = 0
	private deathRattles = 0

	private LashingReadies = 0
	private LastLashings = 0

	private firstLegaciesGained = 0
	private secondLegaciesGained = 0
	private thirdLegaciesGained = 0
	private fourthLegaciesGained = 0
	private firstLegaciesUsed = 0
	private secondLegaciesUsed = 0
	private thirdLegaciesUsed = 0
	private fourthLegaciesUsed = 0

	//Single Target GCDs grant Death Rattle
	DeathRattlers = [
		this.data.actions.HINDSBANE_FANG.id,
		this.data.actions.HINDSTING_STRIKE.id,
		this.data.actions.FLANKSBANE_FANG.id,
		this.data.actions.FLANKSTING_STRIKE.id,
	]

	//AOE GCDs grant last lash
	LastLashers = [
		this.data.actions.JAGGED_MAW.id,
		this.data.actions.BLOODIED_MAW.id,
	]

	//Generations leave behind legacies
	LegacyGrantors = [
		this.data.actions.FIRST_GENERATION.id,
		this.data.actions.SECOND_GENERATION.id,
		this.data.actions.THIRD_GENERATION.id,
		this.data.actions.FOURTH_GENERATION.id,
	]

	LegacySpenders = [
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
				.action(oneOf(this.DeathRattlers)),
			() => this.deathRattleReadies++,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(this.data.actions.DEATH_RATTLE.id),
			() => this.deathRattles++,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.LastLashers)),
			() => this.LashingReadies++,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(this.data.actions.LAST_LASH.id),
			() => this.LastLashings++,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.LegacyGrantors)),
			this.legacyGranted,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.LegacySpenders)),
			this.legacySpent,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private legacyGranted(event: Events['action']) {
		if (event.action === this.data.actions.FIRST_GENERATION.id) {
			this.firstLegaciesGained++
		} else if (event.action === this.data.actions.SECOND_GENERATION.id) {
			this.secondLegaciesGained++
		} else if (event.action === this.data.actions.THIRD_GENERATION.id) {
			this.thirdLegaciesGained++
		} else if (event.action === this.data.actions.FOURTH_GENERATION.id) {
			this.fourthLegaciesGained++
		}
	}

	private legacySpent(event: Events['action']) {
		if (event.action === this.data.actions.FIRST_LEGACY.id) {
			this.firstLegaciesUsed++
		} else if (event.action === this.data.actions.SECOND_LEGACY.id) {
			this.secondLegaciesUsed++
		} else if (event.action === this.data.actions.THIRD_LEGACY.id) {
			this.thirdLegaciesUsed++
		} else if (event.action === this.data.actions.FOURTH_LEGACY.id) {
			this.fourthLegaciesUsed++
		}
	}

	private onComplete() {

		const Counters = {
			deathRattle: {action: this.data.actions.DEATH_RATTLE, ready: this.deathRattleReadies, done: this.deathRattles},
			lastLash: {action: this.data.actions.LAST_LASH, ready: this.LashingReadies, done: this.LastLashings},
			firstLegacy: {action: this.data.actions.FIRST_LEGACY, ready: this.firstLegaciesGained, done: this.firstLegaciesUsed},
			secondLegacy: {action: this.data.actions.SECOND_LEGACY, ready: this.secondLegaciesGained, done: this.secondLegaciesUsed},
			thirdLegacy: {action: this.data.actions.THIRD_LEGACY, ready: this.thirdLegaciesGained, done: this.thirdLegaciesUsed},
			fourthLegacy: {action: this.data.actions.FOURTH_LEGACY, ready: this.fourthLegaciesGained, done: this.fourthLegaciesUsed},
		}

		this.checklist.add(new Rule({
			name: <Trans id="VPR.serpentstail.waste.name"> Use your <DataLink action="SERPENTS_TAIL"/> follow-ups </Trans>,
			displayOrder: DISPLAY_ORDER.SERPENTS_TAIL,
			target: PERFECTIO,
			description: <Trans id="vpr.serpentstail.waste.content">
				Using <DataLink action="HINDSBANE_FANG"/>, <DataLink action="HINDSTING_STRIKE"/>, <DataLink action="FLANKSBANE_FANG"/> or <DataLink action="FLANKSTING_STRIKE"/> grants <DataLink action="DEATH_RATTLE"/>.
				<br/>
				Using <DataLink action="JAGGED_MAW"/> and <DataLink action="BLOODIED_MAW"/> grants <DataLink action="LAST_LASH"/>.
				<br/>
				Using the Generation skills under <DataLink action="REAWAKEN"/> grants Legacy follow up skills.
				<br/>
				These skills are important to a Viper's damage and must be used immediately after the skill that grants them by using <DataLink action="SERPENTS_TAIL"/>.
			</Trans>,
			requirements: [
				...Object.values(Counters)
					.filter(counter => counter.ready > 0)
					.map(counter => this.ChecklistRequirementMaker(counter))
					.filter((requirement): requirement is Requirement => requirement !== undefined),
			],
		}))
	}

	private ChecklistRequirementMaker(counter: {action: Action, ready: number, done: number }) {
		const actual = counter.done
		const expected = counter.ready
		if (expected > 0) {
			let percent = actual / expected * 100
			if (process.env.NODE_ENV === 'production') {
				percent = Math.min(percent, 100)
			}

			return new Requirement({
				name: <ActionLink {...counter.action}/>,
				percent: percent,
				weight: expected,
				overrideDisplay: `${actual} / ${expected} (${percent.toFixed(2)}%)`,
			})
		}
	}
}
