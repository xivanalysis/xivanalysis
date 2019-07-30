/**
 * @author Yumiya
 */
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'

import React, {Fragment} from 'react'
import {Accordion, Icon, Message, List, Table} from 'semantic-ui-react'
import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {Rule, TieredRule, Requirement, TARGET} from 'parser/core/modules/Checklist'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'

import styles from './Barrage.module.css'

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

// Buffer in ms when checking for multiple hits close enough to be from the same cast (completely arbitraty, fite me)
const TRIPLE_HIT_BUFFER = 500

// Weights for each possible bad barrage, for calculating the percent
const BAD_BARRAGE_WEIGHT = 4
const UNALIGNED_BARRAGE_WEIGHT = 1
const PROC_WASTED_WEIGHT = 2
const DROPPED_BARRAGE_WEIGHT = 5

// List of ARC/BRD single-target weaponskills that can be Barrage'd, but shouldn't
const BAD_ST_WEAPONSKILLS = [
	ACTIONS.HEAVY_SHOT.id,
	ACTIONS.BURST_SHOT.id,
	ACTIONS.VENOMOUS_BITE.id,
	ACTIONS.WINDBITE.id,
	ACTIONS.IRON_JAWS.id,
	ACTIONS.CAUSTIC_BITE.id,
	ACTIONS.STORMBITE.id,
]

// List of all ARC/BRD single-target weaponskills
const WEAPONSKILLS = [
	ACTIONS.STRAIGHT_SHOT.id,
	ACTIONS.REFULGENT_ARROW.id,
].concat(BAD_ST_WEAPONSKILLS)

export default class Barrage extends Module {
	static handle = 'barrage'
	static title = t('brd.barrage.title')`Barrage`
	static dependencies = [
		'checklist',
		'util',
	]

	_lastWeaponskill = undefined
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

		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.STRAIGHTER_SHOT.id,
		}, this._onSSApply)

		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.STRAIGHTER_SHOT.id,
		}, this._onSSRemove)

		this.addHook('complete', this._onComplete)

	}

	_onBarrageCast(event) {
		// Creates a new Barrage Event with only the cast information and Raging Strikes alignment for now
		this._addBarrage(event)
	}

	_onStWeaponskillDamage(event) {
		// Checks for damage events that are the same as the last weaponskill damage registered,
		// within TRIPLE_HIT_BUFFER milliseconds of each other
		const skill = this._getLastWeaponskill()

		if (
			skill
			&& this.util.timeSince(skill.timestamp) <= TRIPLE_HIT_BUFFER
			&& skill.id === event.ability.guid
		) {

			// Adds this weaponskill damage event to the list
			skill.addDamageEvent(event)

			// When there are three damage events from the same weaponskill within the buffer time,
			// checks out a Barrage by adding these damage events to the latest Barrage Event object
			// (that only contains the cast event and alignment status at this point)
			if (skill.hits === STATUSES.BARRAGE.amount) {
				this._checkOutBarrage(skill)
			}
		// Otherwise, sets a new last weaponskill event
		} else {
			this._setLastWeaponskill(event)
		}
	}

	_onSSApply() {
		// This so that we can check to see if barrage was used while a Straighter Shot proc was already avaliable
		this._hasSS = true
	}

	_onSSRemove() {
		// This so that we can check to see if barrage was used while a Straighter Shot proc was already avaliable
		this._hasSS = false
	}

	_onComplete() {
		// - badBarrage: Barrage that was used in a skill from BAD_ST_WEAPONSKILLS list
		// - unalignedBarrage: Barrage that was not aligned with Raging Strikes
		const badBarrages = this._barrageEvents.filter(x => x.isBad)
		const unalignedBarrages = this._barrageEvents.filter(x => !x.aligned)
		const wastedProcs = this._barrageEvents.filter(x => x.wastedProc)
		const droppedBarrages = this._barrageEvents.filter(x => x.isDropped)

		// Barrage usage Rule added to the checklist
		if (this._getBarrage()) {
			this.checklist.add(new WeightedTieredRule({
				name: <Trans id="brd.barrage.checklist.default-name">Barrage usage</Trans>,
				description: <Trans id="brd.barrage.checklist.description">
					An analysis of your {ACTIONS.BARRAGE.name} casts. More details in the <a href="javascript:void(0);" onClick={() => this.parser.scrollTo(this.constructor.handle)}><NormalisedMessage message={this.constructor.title}/></a> module below.
				</Trans>,
				tiers: {0: ERROR, 90: WARNING, 100: SUCCESS},
				requirements: [
					new WeightedRequirement({
						name: <Trans id="brd.barrage.checklist.used-on-refulgent"><ActionLink {...ACTIONS.BARRAGE} />s used on <ActionLink {...ACTIONS.REFULGENT_ARROW}/></Trans>,
						percent: () => { return 100 - ((badBarrages.length)* 100 / this._barrageEvents.length) },
						weight: BAD_BARRAGE_WEIGHT,
					}),
					new WeightedRequirement({
						name: <Trans id="brd.barrage.checklist.aligned-barrage"><ActionLink {...ACTIONS.BARRAGE} />s aligned with <ActionLink {...ACTIONS.RAGING_STRIKES} /></Trans>,
						percent: () => { return  100 - ((unalignedBarrages.length) * 100 / this._barrageEvents.length) },
						weight: UNALIGNED_BARRAGE_WEIGHT,
					}),
					new WeightedRequirement({
						name: <Trans id="brd.barrage.checklist.granted-refulgent"><ActionLink {...ACTIONS.BARRAGE} />s that granted <StatusLink {...STATUSES.STRAIGHTER_SHOT} /></Trans>,
						percent: () => { return  100 - ((wastedProcs.length) * 100 / this._barrageEvents.length) },
						weight: PROC_WASTED_WEIGHT,
					}),
					new WeightedRequirement({
						name: <Trans id="brd.barrage.checklist.dealt-damage"><ActionLink {...ACTIONS.BARRAGE} />s that dealt damage</Trans>,
						percent: () => { return  100 - ((droppedBarrages.length) * 100 / this._barrageEvents.length) },
						weight: DROPPED_BARRAGE_WEIGHT,
					}),
				],
			}))
		} else {
			this.checklist.add(new Rule({
				name: <Trans id="brd.barrage.no-barrage-checklist.name">No Barrage usage</Trans>,
				description: <Trans id="brd.barrage.no-barrage-checklist.description"> <ActionLink {...ACTIONS.BARRAGE} /> into <ActionLink {...ACTIONS.REFULGENT_ARROW} /> is Bard's highest single-target attack, make sure to use it during a fight.</Trans>,
				target: 95,
				requirements: [
					new Requirement({
						name: <Trans id="brd.barrage.no-barrage-checklist.no-barrage-cast"><ActionLink {...ACTIONS.BARRAGE} /> cast</Trans>,
						percent: () => 0,
					}),
				],
			}))
		}
	}

	output() {
		const barrageEvents = this._barrageEvents

		if (barrageEvents.length === 0) {
			return
		}

		// Builds a panel for each barrage event
		const panels = barrageEvents.map(barrage => {

			const panelProperties = {
				barrage: barrage,
				title: undefined,
				tuples: [],
				contents: [],
			}
			// If it's any kind of bad barrages:
			//Any bad barrage could have also wasted a straighter shot proc, so do this first
			if (barrage.wastedProc) {
				// Adds the {issue, severity, reason} tuple corresponding a wastedProc to the panel
				panelProperties.tuples.push({
					issue: <Trans id="brd.barrage.issue.wasted-proc">
						There was a <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> proc that went <strong>unused</strong>.
					</Trans>,
					severity: WARNING,
					reason: <Trans id="brd.barrage.issue.wasted-proc.reason">
						{ACTIONS.BARRAGE.name} gives you a guaranteed <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> proc.  If you already have a proc avaliable, use it before using {ACTIONS.BARRAGE.name}.
					</Trans>,
				})
			}
			if (barrage.isDropped) {
				panelProperties.tuples.push({
					issue: <Trans id="brd.barrage.issue.dropped">
						This barrage did <strong>not</strong> deal any damage.
					</Trans>,
					severity: ERROR,
					reason: <Trans id="brd.barrage.issue.dropped.reason">
						Using <StatusLink {...STATUSES.BARRAGE} /> on <strong>anything</strong> is better than letting it drop. Be mindful of transitions and invulnerability periods.
					</Trans>,
				})
			} else if (barrage.isBad || !barrage.aligned) {

				// Calculates the total damage, total DPS, and potential damage for each "good" barrage skill
				const totalDamage = barrage.damageEvents.reduce((x, y) => x + y.amount, 0)
				const totalDPS = this.util.formatDecimal(totalDamage * 1000 / this.parser.fightDuration)

				let potentialDamage = totalDamage
				let potentialRefulgentDamage = Math.trunc(ACTIONS.REFULGENT_ARROW.potency * totalDamage / barrage.skillBarraged.potency)

				// If this barrage is not aligned, multiplies the potential damage with Raging Strikes damage modifier (10%)
				if (!barrage.aligned) {

					// Applies RS modifier
					potentialRefulgentDamage = Math.trunc(potentialRefulgentDamage * (1 +STATUSES.RAGING_STRIKES.amount))
					potentialDamage = Math.trunc(potentialDamage * (1 + STATUSES.RAGING_STRIKES.amount))

					// Adds the {issue, severity, reason} tuple corresponding an unalignedBarrage to the panel
					panelProperties.tuples.push({
						issue: <Trans id="brd.barrage.issue.unaligned-barrage">
							This barrage did <strong>not</strong> receive the effects of <StatusLink {...STATUSES.RAGING_STRIKES}/>.
						</Trans>,
						severity: WARNING,
						reason: <Trans id="brd.barrage.issue.unaligned-barrage.reason">
							Both {ACTIONS.BARRAGE.name} and <ActionLink {...ACTIONS.RAGING_STRIKES} /> have a cooldown of {ACTIONS.BARRAGE.cooldown} seconds. Keeping them aligned is often better than holding onto {ACTIONS.BARRAGE.name}.
						</Trans>,
					})
				}

				// Now that it's gone through the Raging Strikes check, can actually calculate the potential DPS
				// Calculating it beforehand could potentially give rounding errors
				// (It's still not the best way of doing it, but gives me some peace of mind)
				const potentialDPS = this.util.formatDecimal(potentialDamage * 1000 / this.parser.fightDuration)
				const potentialRefulgentDPS = this.util.formatDecimal(potentialRefulgentDamage * 1000 / this.parser.fightDuration)

				// DPS loss is the difference between potential DPS and total DPS (duh)
				let dpsLoss = this.util.formatDecimal(potentialDPS - totalDPS)

				// If this was a badBarrage
				if (barrage.isBad) {

					dpsLoss = `${this.util.formatDecimal(potentialRefulgentDPS - totalDPS)}`

					// Adds the {issue, severity, reason} tuple corresponding a badBarrage to the panel
					panelProperties.tuples.push({
						issue: <Trans id="brd.barrage.issue.bad-barrage">
							This barrage was <strong>not</strong> used on <ActionLink {...ACTIONS.REFULGENT_ARROW}/>.
						</Trans>,
						severity: ERROR,
						reason: <Trans id="brd.barrage.issue.bad-barrage.reason">
							Your strongest weaponskill is <ActionLink {...ACTIONS.REFULGENT_ARROW} />. Make sure you only use your {ACTIONS.BARRAGE.name} on that skill.
						</Trans>,
					})
				}

				// Only adds the DPS loss table as a custom content in case it was any case of bad barrage (badBarrage, unalignedBarrage, worstBarrageNA)
				// That's what the first 'if' is for
				panelProperties.contents.push(<>
					<Table collapsing unstackable celled>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell width={2}>
									<Trans id="brd.barrage.panel.table-header.total-damage"><strong>Total damage</strong></Trans>
								</Table.HeaderCell>
								<Table.HeaderCell width={2}>
									<Trans id="brd.barrage.panel.table-header.potential-damage"><strong>Potential damage</strong></Trans>
								</Table.HeaderCell>
								<Table.HeaderCell width={2} negative>
									<Trans id="brd.barrage.panel.table-header.dps-loss"><strong>DPS loss</strong></Trans>
								</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell>{this.util.formatDamageNumber(totalDamage)}</Table.Cell>
								<Table.Cell>{this.util.formatDamageNumber(potentialDamage)}</Table.Cell>
								<Table.Cell negative>{this.util.formatDamageNumber(dpsLoss)}</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table>
				</>)
			}

			// Then builds the panel and returns it in the mapping function
			return this.buildPanel(panelProperties)

		})

		// Output is an Accordion made with panels, one for each barrage event
		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}

	// Adds a new barrage event to the array, with only cast and alignment information for now
	_addBarrage(event) {

		let aligned = true

		// Checks for Raging Strikes alignment
		if (
			!event
			|| this.util.timeUntilFinish(event.timestamp) >= ACTIONS.BARRAGE.cooldown * 1000
			&& !this.util.hasBuff(STATUSES.RAGING_STRIKES)
		) {
			aligned = false
		}

		// Adds the barrage event to the array
		this._barrageEvents.push({
			castEvent: event,
			aligned: aligned,
			wastedProc: this._hasSS,
			get timestamp() { return this.castEvent ? this.castEvent.timestamp : 0 },
			get isBad() { return this.skillBarraged && this.skillBarraged.id && BAD_ST_WEAPONSKILLS.includes(this.skillBarraged.id) || undefined },
			get isDropped() { return !this.damageEvents || !this.damageEvents.length },
		})
	}

	// Returns the most recent barrage event, or undefined if there's none
	_getBarrage() {
		const index = this._barrageEvents.length - 1
		return index >= 0 ? this._barrageEvents[index] : undefined
	}

	// Checks out a barrage by adding the damage events information to the barrage event and resetting the last skill tracker
	_checkOutBarrage(skill) {

		let barrage = this._getBarrage()

		if (!barrage) {
			// If no previous barrage cast was found, we assume it was pre-pull. We add a barrage with an undefined event
			this._addBarrage()
			barrage = this._getBarrage()
		}

		barrage.skillBarraged = skill.action
		barrage.damageEvents = skill.damageEvents.slice()

		this._lastWeaponskill = undefined
	}

	// Returns the last weaponskill used information (action and damage events)
	_getLastWeaponskill() {
		return this._lastWeaponskill
	}

	// Sets the last weaponskill tracker given the damage event
	_setLastWeaponskill(event) {

		this._lastWeaponskill = {
			action: getDataBy(ACTIONS, 'id', event.ability.guid),
			damageEvents: [event],
			get id() { return this.action && this.action.id },
			get timestamp() { return this.damageEvents && this.damageEvents[0] && this.damageEvents[0].timestamp },
			get hits() { return this.damageEvents && this.damageEvents.length },
			addDamageEvent(event) { this.damageEvents.push(event) },
		}
	}

	// Builds a panel for each cast of Barrage and its respectives issues, to be provided to the final Accordion
	// Each panel has the following components:
	// - A title, containing:
	//    - timestamp
	//    - name of the barrage'd skill
	//    - icon indicating severity
	//    - a custom content, provided via constructor, to be added to the title
	// - A list of issues, containing:
	//    - severity icon and color (tuples[].severity)
	//    - issue description (tuples[].issue)
	// - A list of reasons, containing:
	//    - the reason explaining why each issue is... an issue (tuples[].reason)
	// - A list of contents, containing:
	//    - a custom content, provided via constructor, to be added after the issues and reasons (i.e.: the DPS loss table)
	// - A message block, containing:
	//    - a formatted text log for each barrage hit
	buildPanel({barrage, title, tuples, contents}) {

		// Sorting the tuples by severity
		tuples.sort((a, b) => (a.severity || 0) - (b.severity || 0))

		// Severity of a panel is determined by the highest severity of the issues in it described
		const severity = tuples.length ? this._severitySelector(tuples.map(t => t.severity)) : SUCCESS

		// Panel title
		let defaultTitle = <></>
		if (barrage.isDropped) {
			defaultTitle = <Trans id="brd.barrage.panel.title.barrage-dropped">
				{this.parser.formatTimestamp(barrage.timestamp)} {ACTIONS.BARRAGE.name} used
			</Trans>
		} else {
			defaultTitle = <Trans id="brd.barrage.panel.title.barrage-not-dropped">
				{this.parser.formatTimestamp(barrage.timestamp)} {ACTIONS.BARRAGE.name} used on <ActionLink {...barrage.skillBarraged}/>
			</Trans>
		}

		// List of issues
		const issueElements = tuples && tuples.length && tuples.map(t => {
			return t.issue && <Message key={tuples.indexOf(t)} error={t.severity === ERROR} warning={t.severity === WARNING} success={t.severity === SUCCESS}>
				<Icon name={SEVERITY[t.severity].icon}/>
				<span>{t.issue}</span>
			</Message>
		}) || undefined

		// List of reasons
		const reasonElements = tuples && tuples.length && <div className={styles.description}>
			<List bulleted relaxed>
				{ tuples.map(t => {
					return <List.Item key={tuples.indexOf(t)}>{t.reason}</List.Item>
				})
				}
			</List>
		</div> || undefined

		// List of contents
		const contentElements = contents && contents.length && contents.map(c => {
			return <Fragment key={contents.indexOf(c)}>
				{c}
			</Fragment>
		}) || undefined

		// Damage log
		const damageElements = barrage.damageEvents && barrage.damageEvents.length && <Message info>
			<List>
				<List.Header>
					<Trans id="brd.barrage.panel.damage-elements.header">Damage:</Trans>
				</List.Header>
				<List.Content>
					<List.Item>
						<Icon name={'arrow right'}/>
						{this.util.formatDamageLog(barrage.damageEvents[0])}
					</List.Item>
					<List.Item>
						<Icon name={'arrow right'}/>
						{this.util.formatDamageLog(barrage.damageEvents[1])}
					</List.Item>
					<List.Item>
						<Icon name={'arrow right'}/>
						{this.util.formatDamageLog(barrage.damageEvents[2])}
					</List.Item>
				</List.Content>
			</List>
		</Message> || undefined

		// Builds the full panel
		return {
			key: barrage.timestamp,
			title: {
				content: <>
					<Icon
						name={SEVERITY[severity].icon}
						className={SEVERITY[severity].text}
					/>
					{defaultTitle}
					{title}
				</>,
			},
			content: {
				content: <>
					{issueElements}
					{reasonElements}
					{contentElements}
					{damageElements}
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

// WeightedTieredRule is an extention of TieredRule, with the following additions:
// - Defined a custom percentage method to consider weights for each requirement

class WeightedTieredRule extends TieredRule {

	constructor(options) {
		super({
			...options,
		})

		// Normalize the weights
		const totalWeight = this.requirements.reduce((acc, req) => acc + (req.weight || 1), 0)
		this.requirements.forEach(r => r.weight = (r.weight || 1) / totalWeight)

	}

	get percent() {
		return this.requirements.reduce((acc, req) => acc + (req.percent * req.weight), 0)
	}
}

// WeightedRequirement is an extension of Requirement, with the following addition:
// - A requirement now can have a weight attached to it, used when calculating the overall Rule percentage

class WeightedRequirement extends Requirement {

	constructor(options) {
		super({
			weight: 1,
			...options,
		})
	}

}
