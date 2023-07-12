import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser, DisplayOrder} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {DataSet, PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

interface SeverityTiers {
	[key: number]: number
}

interface TrackedOverhealOpts {
	bucketId?: number
	name: JSX.Element | string;
	color?: string;
	trackedHealIds?: number[];
	ignore?: boolean
	debugName?: string
}

const REGENERATION_ID: number = 1302
const DEFAULT_DISPLAY_ORDER: number = 10

const SUGGESTION_SEVERITY_TIERS: SeverityTiers = {
	0: SEVERITY.MINOR,
	35: SEVERITY.MEDIUM,
	50: SEVERITY.MAJOR,
}

const CHECKLIST_SEVERITY_TIERS: SeverityTiers = {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	[100-35]: TARGET.SUCCESS,
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	[100-50]: TARGET.WARN,
}

export const SuggestedColors: string[] = [
	'#157f1f', // dark green
	'#12ba45', // light green
	'#00b5ad', // dark teal
	'#a0eade', // light teal
	'#b5cc18', // ~~snot green~~ why are you using this?
]

export class TrackedOverheal {
	bucketId: number = -1
	ignore: boolean
	name: JSX.Element | string
	color: string = '#fff'
	protected trackedHealIds: number[]
	heal: number = 0
	overheal: number = 0
	internalDebugName: string | undefined

	constructor(opts: TrackedOverhealOpts) {
		this.name = opts.name
		this.color = opts.color || this.color
		this.trackedHealIds = opts.trackedHealIds || []
		this.bucketId = opts.bucketId || -1
		this.ignore = opts.ignore || false
		this.internalDebugName = opts.debugName
	}

	/**
	 * Get current overheal as a percentage
	 */
	get percent(): number {
		if (this.heal > 0) { return 100 * (this.overheal / this.heal) }
		return 0
	}

	/**
	 * Get current overheal as an inverted percentage (for checklist)
	 */
	get percentInverted(): number {
		return 100 - this.percent
	}

	/**
	 * Returns true if there's data to output
	 */
	get hasData(): boolean {
		if (this.heal > 0 || this.overheal > 0) {
			return true
		}
		return false
	}

	/**
	 * Gets a printable name for the category
	 */
	get debugName(): string {
		if (this.internalDebugName != null) {
			return this.internalDebugName
		}

		if (typeof this.name === 'string') {
			return this.name
		}

		// Trans tags
		if (this.name.props.defaults != null) {
			return this.name.props.defaults
		}

		return 'Unknown'
	}

	/**
	 * Returns true if the action id is tracked
	 * @param guid
	 */
	idIsTracked(guid: number): boolean {
		if (this.trackedHealIds.includes(guid)) {
			return true
		}
		return false
	}

	/**
	 * Pushes a heal event in for tracking
	 * @param event - The heal event to track
	 */
	pushHeal(event: Events['heal']) {
		this.heal += event.targets.reduce((total, target) => total + target.amount, 0)
		this.overheal += event.targets.reduce((total, target) => total + target.overheal, 0)
	}
}

export class Overheal extends Analyser {
	static override handle: string = 'overheal'
	static override debug = false

	@dependency private checklist!: Checklist
	@dependency protected data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private statistics!: Statistics

	// Overall tracking options

	/**
	 * Implementing modules MAY override this to provide a more relevant name for the overhealing requirement
	 */
	protected overhealName: JSX.Element = <Trans id="core.overheal.direct.name">Direct</Trans>
	/**
	 * Implementing moduels MAY override this to change the color for direct overheals in the pie chart
	 */
	protected overhealColor: string = SuggestedColors[0]
	/**
	 * Implementing modules MAY override this to provide a list of heal 'categories' to track
	 */
	protected trackedHealCategories: TrackedOverhealOpts[] = []

	// Display options

	/**
	 * Implementing modules MAY change this to true in order to spit out a spiffy pie chart
	 * breakdown of all their categories they're tracking
	 */
	protected displayPieChart: boolean = false

	/**
	 * Implementing modules MAY wish set this to true in order to provide a suggestion
	 */
	protected displaySuggestion: boolean = false
	/**
	 * Implementing modules MAY change this to set the suggestion icon
	 */
	protected suggestionIcon: string = ACTIONS.SCH_PHYSICK.icon
	/**
	 * Implementing mdoules MAY change this to set the suggestion text
	 */
	protected suggestionContent: JSX.Element = <Trans id="core.overheal.suggestion.content">Avoid healing your party for more than is needed. Cut back on unnecessary heals and coordinate with your co-healer to plan resources efficiently.</Trans>
	/**
	 * Implementing modules MAY change this to define the severity tiers for the suggestion
	 */
	protected suggestionSeverity: SeverityTiers = SUGGESTION_SEVERITY_TIERS

	/**
	 * Implementing modules MAY wish to set this to false in order to suppress adding this as a
	 * checklist item
	 */
	protected displayChecklist: boolean = true

	/**
	 * Implementing modules MAY modify this value to change the order displayed within the stats panel
	 */
	protected statsDisplayOrder: number = DEFAULT_DISPLAY_ORDER

	/**
	 * Allows for more flexibility in ordering of the checklist if necessary.
	 */
	protected displayOrder = DisplayOrder.DEFAULT
	/**
	 * Implementing modules MAY wish to override this to set custom severity tiers.
	 * Do remember that the numbers for checklist are inverted for overheal (e.g., warning at
	 * 35% overheal means you need to set your threshold at 65)
	 */
	protected checklistSeverity: SeverityTiers = CHECKLIST_SEVERITY_TIERS
	/**
	 * Implementing modules MAY wish to override this to change the name for the checklist title
	 */
	protected checklistRuleName: JSX.Element = <Trans id="core.overheal.rule.name">Avoid Overheal</Trans>
	/**
	 * Implementing modules MAY wish to change this in order to reflect the overall healing requiement name
	 */
	protected checklistRequirementName: JSX.Element = <Trans id="core.overheal.requirement.all">Overall (all sources)</Trans>
	/**
	 * Implementing modules MAY change this to true in order to generate multiple requirements for each
	 * category of tracked heals; leaving it at false will only generate a single requirement against
	 * the total overheal percent
	 */
	protected checklistRuleBreakout: boolean = false

	// direct healing
	protected direct!: TrackedOverheal
	// Everything else
	protected trackedOverheals: TrackedOverheal[] = []

	/**
	 * Implementing modules MAY override this to provide the 'why' for suggestion content
	 * @param overhealPercent
	 */
	protected suggestionWhy(overhealPercent: number): JSX.Element {
		return <Trans id="core.overheal.suggestion.why">You had an overheal of { overhealPercent.toFixed(2) }%</Trans>
	}

	override initialise() {
		this.direct = new TrackedOverheal({
			name: this.overhealName,
			color: this.overhealColor,
		})
		for (const healCategoryOpts of this.trackedHealCategories) {
			this.trackedOverheals.push(new TrackedOverheal(healCategoryOpts))
		}

		this.addEventHook(filter<Event>().type('heal').source(this.parser.actor.id), this.onHeal)

		const actorPets = this.parser.pull.actors
			.filter(actor => actor.owner != null && actor.owner.id === this.parser.actor.id)
			.map(pet => pet.id)
		this.addEventHook(filter<Event>().type('heal').source(oneOf(actorPets)), this.onPetHeal)
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * This method MAY be overridden to return true or false, indicating if a heal
	 * should be counted. If true is returned, the heal is counted towards overheal;
	 * false ignores the heal entirely.
	 * @param event
	 */
	protected considerHeal(_event: Events['heal'], _pet: boolean = false): boolean {
		return true
	}

	/**
	 * This method MAY be overridden to provide an alternative checklist description
	 * @param overheals - an array of all the categories of overheals you're tracking, starting with direct
	 */
	protected checklistDescription(_overheals: TrackedOverheal[]): JSX.Element {
		return <Trans id="core.overheal.rule.description">Avoid healing your party for more than is needed. Cut back on unnecessary heals and coordinate with your co-healer to plan resources efficiently.</Trans>
	}

	/**
	 * This method MAY be overriden to force a heal into a specific bucket for whatever reason
	 * @param _event - the healing event to consider
	 * @param _petHeal - whether the heal comes from a pet or not; defaults to false
	 * @returns a number for the bucket to for a heal into. Return -1 to bucket the heal normally
	 */
	protected overrideHealBucket(_event: Events['heal'], _petHeal: boolean = false): number {
		return -1
	}

	private isRegeneration(event: Events['heal']): boolean {
		return event.cause.type === 'action' && event.cause.action === REGENERATION_ID
	}

	private onHeal(event: Events['heal'], petHeal: boolean = false) {
		if (this.isRegeneration(event) || ! this.considerHeal(event, petHeal)) { return }

		const guid = event.cause.type === 'action' ? event.cause.action : event.cause.status
		const name = event.cause.type === 'action' ? this.data.getAction(guid)?.name : this.data.getStatus(guid)?.name

		const bucketId = this.overrideHealBucket(event, petHeal)
		if (bucketId >= 0) {
			for (const trackedHeal of this.trackedOverheals) {
				if (trackedHeal.bucketId === bucketId) {
					this.debug(`Heal ${name} (${guid}) at ${event.timestamp} MANUALLY shoved into bucket ${trackedHeal.debugName}`)
					trackedHeal.pushHeal(event)
				}
			}
			return // return here because you might want to set multiple things with an id to match into multiple categories based on some criteria
		}
		for (const trackedHeal of this.trackedOverheals) {
			if (trackedHeal.idIsTracked(guid)) {
				this.debug(`Heal from ${name} (${guid}) at ${event.timestamp} matched into category ${trackedHeal.debugName}`)
				trackedHeal.pushHeal(event)
				return
			}
		}
		this.debug(`Heal from ${name} (${guid}) at ${event.timestamp} matched into direct healing`)
		this.direct.pushHeal(event)
	}

	private onPetHeal(event: Events['heal']) {
		this.onHeal(event, true)
	}

	private percentageOf(category: number, total: number): number {
		return (100 * category) / total
	}

	private onComplete() {
		let healtotal = this.direct.heal
		let overhealtotal = this.direct.overheal

		this.trackedOverheals.forEach(x => {
			if (!x.ignore && x.hasData) {
				healtotal += x.heal
				overhealtotal += x.overheal
			}
		})
		const overallOverhealPercent: number = 100 * overhealtotal / healtotal

		if (this.displayPieChart) {
			const directPercentage = this.percentageOf(this.direct.overheal, overhealtotal)
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			const data: DataSet<React.ReactNode, 3> = [{
				value: directPercentage,
				color: this.direct.color,
				columns: [
					this.direct.name,
					this.percentageOf(this.direct.overheal, overhealtotal).toFixed(2) + '%',
					this.direct.percent.toFixed(2) + '%',
				],
			}]

			for (const trackedHeal of this.trackedOverheals) {
				if (!trackedHeal.ignore && trackedHeal.hasData) {
					const percentage = this.percentageOf(trackedHeal.overheal, overhealtotal)
					data.push({
						value: percentage,
						color: trackedHeal.color,
						columns: [
							trackedHeal.name,
							percentage.toFixed(2) + '%',
							trackedHeal.percent.toFixed(2) + '%',
						],
					})
				}
			}

			this.statistics.add(new PieChartStatistic({
				headings: [
					<Trans id="core.overheal.header.type" key="core.overheal.header.type">Type of heal</Trans>,
					<Trans id="core.overheal.header.percenttotal" key="core.overheal.header.percenttotal">% of total overheal</Trans>,
					<Trans id="core.overheal.header.percenttype" key="core.overheal.header.percenttype">Overheal % per type</Trans>,
				],
				data: data,
				width: 3, // chart's wide, yo
				statsDisplayOrder: this.statsDisplayOrder,
			}))
		}

		if (this.displayChecklist) {
			const requirements: InvertedRequirement[] = []
			if (this.checklistRuleBreakout) {
				requirements.push(new InvertedRequirement({
					name: this.overhealName,
					percent:  this.direct.percentInverted,
					weight: 0,
				}))

				for (const trackedHeal of this.trackedOverheals) {
					if (trackedHeal.ignore) { continue }

					requirements.push(new InvertedRequirement({
						name: trackedHeal.name,
						percent: trackedHeal.percentInverted,
						weight: 0,
					}))
				}
			}
			requirements.push(new InvertedRequirement({
				name: this.checklistRequirementName,
				percent: 100 - overallOverhealPercent,
			}))

			this.checklist.add(new TieredRule({
				name: this.checklistRuleName,
				description: this.checklistDescription([this.direct, ...this.trackedOverheals]),
				tiers: this.checklistSeverity,
				requirements,
				displayOrder: this.displayOrder,
			}))
		}

		if (this.displaySuggestion) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.suggestionIcon,
				tiers: this.suggestionSeverity,
				value: overallOverhealPercent,
				content: this.suggestionContent,
				why: this.suggestionWhy(overallOverhealPercent),
			}))
		}
	}
}

// From the original comments:
// yeh, I'm not doing this in core, but I really want to show overheal as overheal, since that's what the community understands
// So, in keeping with that spirit, I'm not going to export this at all.
class InvertedRequirement extends Requirement {
	get percentInverted() {
		return 100 - this.percent
	}

	override get content() {
		if (this._percent !== null || this.value === null) { return `${this.percentInverted.toFixed(2)}%` }
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}` // avoid weird floating point shit
	}
}
