/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import {Accordion, Icon, Message, List, Table} from 'semantic-ui-react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS, {getAction} from 'data/ACTIONS'
import {TieredRule, Requirement, TARGET} from 'parser/core/modules/Checklist'
import {ActionLink, StatusLink} from 'components/ui/DbLink'

import styles from 'parser/jobs/brd/Barrage.module.css'

const SUCCESS = TARGET.SUCCESS
const WARNING = TARGET.WARN
const ERROR = TARGET.FAIL

const SEVERITY = {
	[SUCCESS]: {
		icon: 'checkmark',
		text: 'text-success',
	},
	[WARNING]: {
		icon: 'warning sign',
		text: 'text-warning',
	},
	[ERROR]: {
		icon: 'remove',
		text: 'text-error',
	},
}

// Buffer in ms when checking for barrage status
const BARRAGE_BUFFER = 700
// Buffer in ms when checking for multiple hits close enough to be from the same cast (completely arbitraty, fite me)
const TRIPLE_HIT_BUFFER = 500

// Weights for each possible bad barrage, for calculating the percent
const WORST_BARRAGE_NA_WEIGHT = 0.5
const BAD_BARRAGE_WEIGHT = 0.4
const UNALIGNED_BARRAGE_WEIGHT = 0.1

// List of ARC/BRD single-target weaponskills that can be Barrage'd, but shouldn't
const BAD_ST_WEAPONSKILLS = [
	ACTIONS.HEAVY_SHOT.id,
	ACTIONS.VENOMOUS_BITE.id,
	ACTIONS.STRAIGHT_SHOT.id,
	ACTIONS.WINDBITE.id,
	ACTIONS.IRON_JAWS.id,
	ACTIONS.CAUSTIC_BITE.id,
	ACTIONS.STORMBITE.id,
]

// List of all ARC/BRD single-target weaponskills
const WEAPONSKILLS = [
	ACTIONS.REFULGENT_ARROW.id,
	ACTIONS.EMPYREAL_ARROW.id,
].concat(BAD_ST_WEAPONSKILLS)

export default class Barrage extends Module {
	static handle = 'barrage'
	static dependencies = [
		'checklist',
		'util',
	]
	// First two currently unused
	_cuckedByDeath = []
	_droppedBarrages = []
	_unalignedBarrages = []
	_lastStWeaponskill = []

	_barrageEvents = []

	constructor(...args) {
		super(...args)

		// Event hooks
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.BARRAGE.id,
		}, this._onBarrageCast)

		this.addHook('damage', {
			by: 'player',
			abilityId: WEAPONSKILLS,
		}, this._onStWeaponskillDamage)

		this.addHook('death', {
			to: 'player',
		}, this._onDeath)

		this.addHook('complete', this._onComplete)

	}

	_onBarrageCast(event) {
		// Creates a new BarrageEvent with only the cast information and Raging Strikes alignment for now
		this._barrageEvents.push(new BarrageEvent(event, this.util))
	}

	_onStWeaponskillDamage(event) {
		// Checks for damage events that are the same as the last weaponskill damage registered,
		// within TRIPLE_HIT_BUFFER milliseconds of each other

		if (
			this._lastStWeaponskill.length
			&& this.util.timeSince(this._lastStWeaponskill[0]) <= TRIPLE_HIT_BUFFER
			&& this._lastStWeaponskill[0].ability.guid === event.ability.guid
		) {

			// Adds this weaponskill damage event to the list
			this._lastStWeaponskill.push(event)

			// When there are three damage events from the same weaponskill within the buffer time,
			// checks out a Barrage by adding these damage events to the latest BarrageEvent object
			// (that only contains the cast event and alignment status at this point)
			if (this._lastStWeaponskill.length === STATUSES.BARRAGE.amount) {

				const last = this._barrageEvents.length - 1

				this._barrageEvents[last].skillBarraged = event.ability.guid
				this._barrageEvents[last].damageEvents = this._lastStWeaponskill.slice()

				// Empties the arrays that holds up to the last three weaponskill damage events
				this._lastStWeaponskill = []
			}
		// Otherwise, empties the weaponskill damage events array and pushes this one into it
		} else {
			this._lastStWeaponskill = []
			this._lastStWeaponskill.push(event)
		}
	}

	_onDeath() {
		// Currently unused, but will be used to check for Barrage drops cause by death

		const last = this._barrageEvents.length - 1

		if (this._barrageEvents.length
			&& !this._barrageEvents[last].skillBarraged
			&& this.util.timeSince(this._barrageEvents[last]) < STATUSES.BARRAGE.duration + BARRAGE_BUFFER) {

			this._cuckedByDeath.push(this._barrageEvents[last])

		}
	}

	_onComplete() {
		// Separates the three kinds of bad barrages:
		// - badBarrage: Barrage that was used in a skill from BAD_ST_WEAPONSKILLS list
		// - unalignedBarrage: Barrage that was not aligned with Raging Strikes
		// - worstBarrageNA: All of the above
		const badBarrages = this._barrageEvents.filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) && x.aligned)
		const unalignedBarrages = this._barrageEvents.filter(x => !BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) && !x.aligned)
		const worstBarragesNA = this._barrageEvents.filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) && !x.aligned)

		// Barrage usage Rule added to the checklist
		// Explanation of each custom class in the comments below
		if (badBarrages && badBarrages.length || unalignedBarrages && unalignedBarrages.length || worstBarragesNA && worstBarragesNA.length) {
			this.checklist.add(new BarrageRule({
				name: 'Barrage usage',
				description: <Fragment>
					Some of your {ACTIONS.BARRAGE.name} casts weren't optimal. More details below.
				</Fragment>,
				tiers: {0: ERROR, 90: WARNING, 100: SUCCESS},
				requirements: [
					new BarrageRequirement({
						name: <Fragment><ActionLink {...ACTIONS.BARRAGE} />s used on wrong skills</Fragment>,
						percent: () => { return (badBarrages.length + worstBarragesNA.length)* 100 / this._barrageEvents.length },
						weight: BAD_BARRAGE_WEIGHT,
					}),
					new BarrageRequirement({
						name: <Fragment><ActionLink {...ACTIONS.BARRAGE} />s not aligned with <ActionLink {...ACTIONS.RAGING_STRIKES} /></Fragment>,
						percent: () => { return (unalignedBarrages.length + worstBarragesNA.length) * 100 / this._barrageEvents.length },
						weight: UNALIGNED_BARRAGE_WEIGHT,
					}),
				],
				extras: [
					new BarrageRequirement({
						name: 'worstBarragesNA',
						percent: () => { return worstBarragesNA.length * 100 / this._barrageEvents.length },
						weight: WORST_BARRAGE_NA_WEIGHT,
					}),
				],
				reverse: true,
			}))
		}
	}

	output() {
		const badBarrages = this._barrageEvents

		if (badBarrages.length === 0) {
			return
		}

		// Builds a panel for each barrage event
		const panels = badBarrages.map(barrage => {

			const panel = new BarragePanel({
				barrage: barrage,
				title: null,
				headers: [],
				contents: [],
				util: this.util,
			})

			// If it's any of the three kinds of bad barrages:
			if (BAD_ST_WEAPONSKILLS.includes(barrage.skillBarraged) || !barrage.aligned) {

				// Calculates the total damage, total DPS, and potential damage for each "good" barrage skill
				const totalDamage = barrage.damageEvents.reduce((x, y) => x + y.amount, 0)
				const totalDPS = this.util.formatDecimal(totalDamage * 1000 / this.parser.fightDuration)

				let potentialDamage = totalDamage
				let potentialEmpyrealDamage = Math.trunc(ACTIONS.EMPYREAL_ARROW.potency * totalDamage / getAction(barrage.skillBarraged).potency)
				let potentialRefulgentDamage = Math.trunc(ACTIONS.REFULGENT_ARROW.potency * totalDamage / getAction(barrage.skillBarraged).potency)

				// If this barrage is not aligned, multiplies the potential damage with Raging Strikes damage modifier (10%)
				if (!barrage.aligned) {

					// Applies RS modifier
					potentialEmpyrealDamage = Math.trunc(potentialEmpyrealDamage * (1 +STATUSES.RAGING_STRIKES.amount))
					potentialRefulgentDamage = Math.trunc(potentialRefulgentDamage * (1 +STATUSES.RAGING_STRIKES.amount))
					potentialDamage = Math.trunc(potentialDamage * (1 + STATUSES.RAGING_STRIKES.amount))

					// Adds the {issue, severity, reason} tuple corresponding an unalignedBarrage to the panel
					panel.headers.push({
						issue: <>
							This barrage did <strong>not</strong> receive the effects of <StatusLink {...STATUSES.RAGING_STRIKES}/>.
						</>,
						severity: WARNING,
						reason: <>
							Both {ACTIONS.BARRAGE.name} and <ActionLink {...ACTIONS.RAGING_STRIKES} /> have a cooldown of {ACTIONS.BARRAGE.cooldown} seconds. Keeping them aligned is often better than holding onto {ACTIONS.BARRAGE.name}.
						</>,
					})

				}

				// Now that it's gone through the Raging Strikes check, can actually calculate the potential DPS
				// Calculating it beforehand could potentially give rounding errors
				// (It's still not the best way of doing it, but gives me some peace of mind)
				const potentialDPS = this.util.formatDecimal(potentialDamage * 1000 / this.parser.fightDuration)
				const potentialEmpyrealDPS = this.util.formatDecimal(potentialEmpyrealDamage * 1000 / this.parser.fightDuration)
				const potentialRefulgentDPS = this.util.formatDecimal(potentialRefulgentDamage * 1000 / this.parser.fightDuration)

				// DPS loss is the difference between potential DPS and total DPS (duh)
				let dpsLoss = this.util.formatDecimal(potentialDPS - totalDPS)

				// If this was a badBarrage
				if (BAD_ST_WEAPONSKILLS.includes(barrage.skillBarraged)) {

					// Potential damage and DPS loss then become an interval, because a badBarrage could've been either Empyreal Arrow or Refulgent Arrow
					potentialDamage = `${potentialEmpyrealDamage} - ${potentialRefulgentDamage}`
					dpsLoss = `${this.util.formatDecimal(potentialEmpyrealDPS - totalDPS)} - ${this.util.formatDecimal(potentialRefulgentDPS- totalDPS)}`

					// Adds the {issue, severity, reason} tuple corresponding a badBarrage to the panel
					panel.headers.push({
						issue: <>
							This barrage was <strong>not</strong> used on <ActionLink {...ACTIONS.EMPYREAL_ARROW}/> or <ActionLink {...ACTIONS.REFULGENT_ARROW}/>.
						</>,
						severity: ERROR,
						reason: <>
							Your two strongest weaponskills are <ActionLink {...ACTIONS.EMPYREAL_ARROW} /> and <ActionLink {...ACTIONS.REFULGENT_ARROW} />. Make sure you only use your {ACTIONS.BARRAGE.name} on these two skills.
						</>,
					})
				}

				// Only adds the DPS loss table as a custom content in case it was any case of bad barrage (badBarrage, unalignedBarrage, worstBarrageNA)
				// That's what the first 'if' is for
				panel.contents.push(<>
					<Table collapsing unstackable celled>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell width={2}>
									<strong>Total damage</strong>
								</Table.HeaderCell>
								<Table.HeaderCell width={2}>
									<strong>Potential damage</strong>
								</Table.HeaderCell>
								<Table.HeaderCell width={2} negative>
									<strong>DPS loss</strong>
								</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell>{totalDamage}</Table.Cell>
								<Table.Cell>{potentialDamage}</Table.Cell>
								<Table.Cell negative>{dpsLoss}</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table>
				</>)
			}

			// Then builds the panel and returns it in the mapping function
			return panel.build()

		})

		// Output is an Accordion made with panels, one for each barrage event
		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}

// BarrageEvent is an object used to describe a Barrage.
// Contains information about the cast event, the damage events, the id of the barraged skill, and alignment status with Raging Strikes

class BarrageEvent {
	util = null

	castEvent = null
	skillBarraged = null
	damageEvents = []
	// Assuming barrage was aligned with Raging Strikes. Will set to false if determined otherwise
	aligned = true

	constructor(event, util) {
		this.util = util

		this.castEvent = event

		// Checks for Raging Strikes alignment, ignoring the alignment check in case this cast was the last possible usage
		if (
			this.util.hasBuff(STATUSES.RAGING_STRIKES)
			&& this.util.timeUntilFinish(event) >= ACTIONS.BARRAGE.cooldown * 1000
		) {
			this.aligned = false
		}
	}

	get timestamp() {
		return this.castEvent && this.castEvent.timestamp
	}
}

// BarrageRule is an extention of TieredRule, with the following additions:
// - Able to pass Requirements that are used for calculating the percentage, but are not shown in the Rule panel
// - Defined a custom percentage method to consider weights for each issue
// - Added a 'reverse' boolean, for cases where 100% means 100% BAD (i.e.: 100% of barrages were bad barrages)

class BarrageRule extends TieredRule {

	constructor(options) {
		super({
			extras: [],
			reverse: false,
			...options,
		})

	}

	get percent() {

		const percents = this.requirements.map(requirement => { return {percent: requirement.percent, weight: requirement.weight} })
		const extraPercents = this.extras.map(extra => { return {percent: extra.percent, weight: extra.weight} })
		const percent = percents.reduce((acc, val) => acc + (val.percent * val.weight), 0) + extraPercents.reduce((acc, val) => acc + (val.percent * val.weight), 0)

		return this.reverse ? 100 - percent : percent
	}
}

// BarrageRequirement is an extension of Requirement, with the following addition:
// - A requirement now can have a weight attached to it, used when calculating the overall Rule percentage

class BarrageRequirement extends Requirement {

	constructor(options) {
		super({
			weight: 1,
			...options,
		})
	}

}

// BarragePanel is a custom class that defines and builds a modular panel,
//  for each cast of Barrage and its respectives issues,
//  to be provided to the final Accordion

// Each panel has the following components:
// - A title, containing:
//    - timestamp
//    - name of the barrage'd skill
//    - icon indicating severity
//    - a custom content, provided via constructor, to be added to the title
// - A list of issues, containing:
//    - severity icon and color (header[].severity)
//    - issue description (header[].issue)
// - A list of reasons, containing:
//    - the reason explaining why each issue is... an issue (header[].reason)
// - A list of contents, containing:
//    - a custom content, provided via constructor, to be added after the issues and reasons (i.e.: the DPS loss table)
// - A message block, containing:
//    - a formatted text log for each barrage hit

class BarragePanel {

	barrage = null
	title = null
	headers = []
	contents = []
	util = null

	constructor(options) {

		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}

	// Severity of a panel is determined by the highest severity of the issues in it described
	get severity() {
		return this.headers.length ? this._severitySelector(this.headers.map(h => h.severity)) : SUCCESS
	}

	// Builds the panel to be given to the Accordion
	build() {

		// List of issues
		const issueElements = this.headers && this.headers.length && this.headers.map(h => {
			return h.issue && <Message key={this.headers.indexOf(h)} error={h.severity === ERROR} warning={h.severity === WARNING} success={h.severity === SUCCESS}>
				<Icon name={SEVERITY[h.severity].icon}/>
				<span>{h.issue}</span>
			</Message>
		}) || undefined

		// List of reasons
		const reasonElements = this.headers && this.headers.length && <div className={styles.description}>
			<List bulleted relaxed>
				{ this.headers.map(h => {
					return <List.Item key={this.headers.indexOf(h)}>{h.reason}</List.Item>
				})
				}
			</List>
		</div> || undefined

		// List of contents
		const contentElements = this.contents && this.contents.length && this.contents.map(c => {
			return <Fragment key={this.contents.indexOf(c)}>
				{c}
			</Fragment>
		}) || undefined

		// Builds the full panel
		return {
			key: this.barrage.timestamp,
			title: {
				content: <>
					<Icon
						name={SEVERITY[this.severity].icon}
						className={SEVERITY[this.severity].text}
					/>
					{this.util.formatTimestamp(this.barrage.timestamp)} - {ACTIONS.BARRAGE.name} used on <ActionLink {...getAction(this.barrage.skillBarraged)}/>
					{this.title}.
				</>,
			},
			content: {
				content: <>
					{issueElements}
					{reasonElements}
					{contentElements}
					<Message info>
						<List>
							<List.Header>
								Damage:
							</List.Header>
							<List.Content>
								<List.Item>
									<Icon name={'arrow right'}/>
									{this.util.formatDamageLog(this.barrage.damageEvents[0])}
								</List.Item>
								<List.Item>
									<Icon name={'arrow right'}/>
									{this.util.formatDamageLog(this.barrage.damageEvents[1])}
								</List.Item>
								<List.Item>
									<Icon name={'arrow right'}/>
									{this.util.formatDamageLog(this.barrage.damageEvents[2])}
								</List.Item>
							</List.Content>
						</List>
					</Message>
				</>,
			},
		}
	}

	// Needs to be fancy for this, since one type of severity is 'undefined'
	_severitySelector(severities) {
		const severity = Math.min(...severities.map(s => s || 0))

		return severity !== 0 ? severity : undefined
	}
}

