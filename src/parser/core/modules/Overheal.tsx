import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {TransMarkdown} from 'components/ui/TransMarkdown'
import {getDataBy} from 'data'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Cause, Event, Events} from 'event'
import {Analyser, DisplayOrder} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Fragment, ReactNode} from 'react'
import {Accordion, Icon, Message, Table} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import {Actors} from './Actors'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {Invulnerability} from './Invulnerability'

export interface TrackedOverhealOpts {
	bucketId?: number
	name: JSX.Element | string;
	trackedHealIds?: Array<Action['id'] | Status['id']>;
	/**
	 * Pass true to fully exclude this bucket from checklist and display
	 */
	ignore?: boolean
	/**
	 * Pass true to include this bucket in the checklist requirements
	 * Also defaults the bucket as expanded/active in the accordion output
	 */
	includeInChecklist?: boolean
	debugName?: string
}

const REGENERATION_ID: number = 1302

// Target based on the old tiered success target of 35
const CHECKLIST_TARGET = 65

interface OverhealCauseData {
	heal: number,
	overheal: number,
	type?: Cause['type'],
	count: number,
}

export class TrackedOverheal {
	bucketId: number = -1
	ignore: boolean
	includeInChecklist: boolean
	name: JSX.Element | string
	protected trackedHealIds: Array<Action['id'] | Status['id']>
	heal: number = 0
	overheal: number = 0
	internalDebugName: string | undefined
	causes: Map<number, OverhealCauseData> = new Map()

	constructor(opts: TrackedOverhealOpts) {
		this.name = opts.name
		this.trackedHealIds = opts.trackedHealIds || []
		this.bucketId = opts.bucketId || -1
		this.ignore = opts.ignore || false
		this.includeInChecklist = opts.includeInChecklist || false
		this.internalDebugName = opts.debugName

		// Initialize the causes map to preserve the ordering specified by the job
		this.trackedHealIds.forEach((healId) => this.causes.set(healId, {
			heal: 0,
			overheal: 0,
			count: 0,
		}))
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
		const eventHeal = event.targets.reduce((total, target) => total + target.amount, 0)
		const eventOverheal = event.targets.reduce((total, target) => total + target.overheal, 0)

		const guid = event.cause.type === 'action' ? event.cause.action : event.cause.status
		const cause = this.causes.get(guid)

		// If this cause ID is missing, it's because the heal was overridden into this bucket. Add the data now
		if (!cause) {
			this.causes.set(guid, {
				heal: eventHeal,
				overheal: eventOverheal,
				type: event.cause.type,
				count: 1,
			})
		} else {
			cause.heal += eventHeal
			cause.overheal += eventOverheal
			cause.count++
			cause.type = event.cause.type
		}

		this.heal += eventHeal
		this.overheal += eventOverheal
	}
}

export class Overheal extends Analyser {
	static override handle: string = 'overheal'
	static override title = t('core.overheal.title')`Overheal`
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES
	static override debug = false

	@dependency private checklist!: Checklist
	@dependency protected data!: Data
	@dependency protected actors!: Actors
	@dependency private invulnerability!: Invulnerability

	// Overall tracking options

	private uncategorizedOverheals: JSX.Element = <Trans id="core.overheal.uncategorized.name">Uncategorized</Trans>

	/**
	 * A selection of category names we expect to be used across multiple jobs and would like to have consistent copy/translations for
	 */
	protected defaultCategoryNames = {
		// Yes this is from SGE since I didn't want to force re-translation after this update
		DIRECT_GCD_HEALS: <Trans id="sge.overheal.direct.name">GCD Heals</Trans>,
		OVER_TIME_GCD_HEALS: <Trans id="core.overheal.gcd-hot.name">Healing over Time from GCD Spells</Trans>,
		DIRECT_HEALING_ABILITIES: <Trans id="core.overheal.abilities-direct.name">Direct Healing Abilities</Trans>,
		// Similarly snitched from AST
		HEALING_OVER_TIME: <Trans id="ast.overheal.hot.name">Healing over Time</Trans>,
		OTHER_HEALING_ABILITIES: <Trans id="core.overheal.abilities-other.name">Other Healing Abilities</Trans>,
		SHIELD_GCD_OVERWRITE: <Trans id="core.overheal.shield-overwrites.name">Shield GCDs (overwritten shield)</Trans>,
		SHIELD_GCD_APPLICATION: <Trans id="sge.overheal.shield-application.name">Shield GCDs (fresh application)</Trans>,
	}

	/**
	 * Implementing modules MAY override this to provide a list of heal 'categories' to track for the checklist.
	 * It's recommended to list any categories to be included in the checklist first,
	 * so they also display first in the module output.
	 */
	protected trackedHealCategories: TrackedOverhealOpts[] = []

	// Display options

	/**
	 * Implementing modules MAY change this to true in order to suppress the module output table
	 */
	protected suppressOutput: boolean = false

	/**
	 * Implementing modules MAY wish to set this to false in order to suppress adding this as a
	 * checklist item
	 */
	protected displayChecklist: boolean = true

	/**
	 * Allows for more flexibility in ordering of the checklist if necessary.
	 */
	protected checklistDisplayOrder = DisplayOrder.DEFAULT

	/**
	 * Implementing modules MAY wish to override this to set a custom checklist target.
	 * Do remember that the numbers for checklist are inverted for overheal (e.g., failing at
	 * 35% overheal means you need to set your target to 65)
	 */
	protected checklistTarget: number = CHECKLIST_TARGET

	/**
	 * Implementing modules MAY wish to override this to change the name for the checklist title
	 */
	protected checklistRuleName: JSX.Element = <Trans id="core.overheal.rule.name">Avoid Overheal</Trans>

	/**
	 * Implementing modules MAY wish to change this in order to reflect the overall healing requiement name
	 */
	protected checklistRequirementName: JSX.Element = <Trans id="core.overheal.requirement.all">Overall</Trans>

	// Uncategorized healing
	protected uncategorized!: TrackedOverheal

	// Everything else
	protected trackedOverheals: TrackedOverheal[] = []

	/**
	 * Implementing modules MAY override this to provide the 'why' for suggestion content
	 * @param overhealPercent
	 */
	protected suggestionWhy(overhealPercent: number): JSX.Element {
		return <Trans id="core.overheal.suggestion.why">You had an overheal of { overhealPercent.toFixed(2) }%</Trans>
	}

	protected statusAppliedInDowntime: Map<Status['id'], boolean> = new Map()

	override initialise() {
		this.uncategorized = new TrackedOverheal({
			name: this.uncategorizedOverheals,
			includeInChecklist: true,
		})
		for (const healCategoryOpts of this.trackedHealCategories) {
			this.trackedOverheals.push(new TrackedOverheal(healCategoryOpts))
		}

		this.addEventHook(filter<Event>().type('heal').source(this.parser.actor.id), this.onHeal)

		const actorPets = this.parser.pull.actors
			.filter(actor => actor.owner != null && actor.owner.id === this.parser.actor.id)
			.map(pet => pet.id)
		this.addEventHook(filter<Event>().type('heal').source(oneOf(actorPets)), this.onPetHeal)

		const healStatuses = this.trackedHealCategories.reduce<number[]>((acc, category) => {
			const categoryStatusHeals = (category.trackedHealIds ?? []).filter((healId) => getDataBy(this.data.statuses, 'id', healId))
			acc.push(...categoryStatusHeals)
			return acc
		}, [])
		this.addEventHook(filter<Event>().type('statusApply').source(this.parser.actor.id)
			.status(oneOf(healStatuses)), this.onHealStatusApply)

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
		if (this.isRegeneration(event) || !this.considerHeal(event, petHeal)) { return }

		const guid = event.cause.type === 'action' ? event.cause.action : event.cause.status
		const name = event.cause.type === 'action' ? this.data.getAction(guid)?.name : this.data.getStatus(guid)?.name

		const bucketId = this.overrideHealBucket(event, petHeal)
		if (bucketId >= 0) {
			if (this.uncategorized.bucketId === bucketId) {
				this.debug(`Heal ${name} (${guid}) at ${event.timestamp} MANUALLY shoved into direct healing`)
				this.uncategorized.pushHeal(event)
			}
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
		this.uncategorized.pushHeal(event)
	}

	private onPetHeal(event: Events['heal']) {
		this.onHeal(event, true)
	}

	private onHealStatusApply(event: Events['statusApply']) {
		this.statusAppliedInDowntime.set(event.status, this.isDowntimeEvent(event))
	}

	// Treat events before the pull or when the boss is untargetable as downtime events
	protected isDowntimeEvent(event: Event) {
		return event.timestamp < this.parser.pull.timestamp || this.invulnerability.isActive({timestamp: event.timestamp, types: ['untargetable']})
	}

	private onComplete() {
		let healtotal = this.uncategorized.heal
		let overhealtotal = this.uncategorized.overheal

		this.trackedOverheals.forEach(x => {
			if (!x.ignore && x.includeInChecklist && x.hasData) {
				healtotal += x.heal
				overhealtotal += x.overheal
			}
		})
		const overallOverhealPercent: number = (healtotal === 0) ? 0 : 100 * overhealtotal / healtotal

		if (this.displayChecklist) {
			const requirements: InvertedRequirement[] = []

			// Ideally, job modules will categorize all possible sources of healing
			// Only include this in the checklist if there was actually data
			if (this.uncategorized.hasData) {
				requirements.push(new InvertedRequirement({
					name: this.uncategorizedOverheals,
					percent:  this.uncategorized.percentInverted,
					weight: 0,
				}))
			}

			for (const trackedHeal of this.trackedOverheals) {
				if (trackedHeal.ignore || !trackedHeal.includeInChecklist) { continue }

				requirements.push(new InvertedRequirement({
					name: trackedHeal.name,
					percent: trackedHeal.percentInverted,
					weight: 0,
				}))
			}

			requirements.push(new InvertedRequirement({
				name: this.checklistRequirementName,
				percent: 100 - overallOverhealPercent,
			}))

			this.checklist.add(new Rule({
				name: this.checklistRuleName,
				description: this.checklistDescription([this.uncategorized, ...this.trackedOverheals]),
				requirements,
				target: this.checklistTarget,
				displayOrder: this.checklistDisplayOrder,
			}))
		}
	}

	override output(): ReactNode {
		if (this.suppressOutput) { return }

		const rows = [this.uncategorized, ...this.trackedOverheals].map((bucket) => this.buildPanel(bucket)).filter(isDefined)
		return <Fragment>
			<Message icon>
				<Icon name="info" />
				<Message.Content>
					<TransMarkdown source={outputHeader}/>
				</Message.Content>
			</Message>
			<Accordion
				exclusive={false}
				styled
				fluid
				defaultActiveIndex={rows.map((row, idx) => row.startActive ? idx : undefined).filter(isDefined)}
				panels={rows.map(row => row.panel)}
			/>
		</Fragment>
	}

	private buildPanel(bucket: TrackedOverheal) {
		if (bucket.ignore || !bucket.hasData) { return }

		const tableBody = (Array.from(bucket.causes.keys())).map((causeId) => {
			const causeData = bucket.causes.get(causeId)
			if (!causeData) { return }
			if (!causeData.type) { return }

			const causeLink = causeData.type === 'action' ?
				<ActionLink {...getDataBy(this.data.actions, 'id', causeId)} /> :
				<StatusLink {...getDataBy(this.data.statuses, 'id', causeId)} />
			const overhealPercent = 100 * causeData.overheal / causeData.heal
			const healingPerSecond = causeData.heal / this.parser.pull.duration * 1000

			return <Table.Row key={causeId}>
				<Table.Cell>{causeLink}</Table.Cell>
				<Table.Cell textAlign="right">{causeData.count.toLocaleString()}</Table.Cell>
				<Table.Cell textAlign="right">{healingPerSecond.toFixed(2)}</Table.Cell>
				<Table.Cell textAlign="right">{overhealPercent.toFixed(2)}%</Table.Cell>
			</Table.Row>
		})

		if (!tableBody) { return }

		return {
			startActive: bucket.includeInChecklist,
			panel: {
				key: bucket.bucketId,
				title: {
					content: bucket.name,
				},
				content: {
					content: <Table compact unstackable celled>
						<Table.Header>
							<Table.HeaderCell><Trans id="core.overheal.table.source.header">Heal Source</Trans></Table.HeaderCell>
							<Table.HeaderCell textAlign="right"><Trans id="core.overheal.table.count.header">Count</Trans></Table.HeaderCell>
							<Table.HeaderCell textAlign="right"><Trans id="core.overheal.table.hps.header">HPS</Trans></Table.HeaderCell>
							<Table.HeaderCell textAlign="right"><Trans id="core.overheal.table.overheal-percent.header">Overheal %</Trans></Table.HeaderCell>
						</Table.Header>
						<Table.Body>{tableBody}</Table.Body>
					</Table>,
				},
			},
		}
	}
}

const outputHeader = t('core.overheal.header.content')`
Overhealing is unavoidable even with optimized usage of your actions, but it can
also be a result of poor planning. As such, overhealing must be analyzed on a
case-by-case basis.

The below tables will show you which actions overhealed. Focus on reducing the
overheal percentage of the categories included in the checklist first. The other
categories typically have secondary purposes, or may overheal as an incidental
part of a complete defensive plan.
`

// From the original comments:
// yeh, I'm not doing this in core, but I really want to show overheal as overheal, since that's what the community understands
// So, in keeping with that spirit, I'm not going to export this at all.
class InvertedRequirement extends Requirement {
	get percentInverted() {
		return 100 - this.percent
	}

	override get content() {
		if (this._percent != null || this.value == null) { return `${this.percentInverted.toFixed(2)}%` }
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}` // avoid weird floating point shit
	}
}
