/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import {Accordion, Icon, Message, List, Table} from 'semantic-ui-react'
import Module from '../../core/Module'
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

const BARRAGE_BUFFER = 700
const TRIPLE_HIT_BUFFER = 500

const WORST_BARRAGE_NA_WEIGHT = 0.5
const BAD_BARRAGE_WEIGHT = 0.4
const UNALIGNED_BARRAGE_WEIGHT = 0.1

const BAD_ST_WEAPONSKILLS = [
	ACTIONS.HEAVY_SHOT.id,
	ACTIONS.VENOMOUS_BITE.id,
	ACTIONS.STRAIGHT_SHOT.id,
	ACTIONS.WINDBITE.id,
	ACTIONS.IRON_JAWS.id,
	ACTIONS.CAUSTIC_BITE.id,
	ACTIONS.STORMBITE.id,
]

const WEAPONSKILLS = [
	ACTIONS.REFULGENT_ARROW.id,
	ACTIONS.EMPYREAL_ARROW.id,
].concat(BAD_ST_WEAPONSKILLS)

export default class Barrage extends Module {
	static handle = 'barrage'
	static dependencies = [
		'checklist',
		'combatants',
		'util',
	]

	_cuckedByDeath = []
	_droppedBarrages = []
	_unalignedBarrages = []
	_lastStWeaponskill = []

	_barrageEvents = []

	constructor(...args) {
		super(...args)

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.BARRAGE.id,
		}

		const stWeaponskillFilter = {
			by: 'player',
			abilityId: WEAPONSKILLS,
		}

		const deathFilter = {
			to: 'player',
		}

		this.addHook('cast', castFilter, this._onBarrageCast)
		this.addHook('damage', stWeaponskillFilter, this._onStWeaponskillDamage)
		this.addHook('death', deathFilter, this._onDeath)
		this.addHook('complete', this._onComplete)

	}

	_onBarrageCast(event) {

		const barrageEvent = new BarrageEvent()

		barrageEvent.castEvent = event
		barrageEvent.skillBarraged = null
		barrageEvent.damageEvents = []

		// Checks for alignment and ignores last use alignment
		if (!this.combatants.selected.hasStatus(STATUSES.RAGING_STRIKES.id) && this.util.timeUntilFinish(event) >= ACTIONS.BARRAGE.cooldown * 1000) {
			barrageEvent.aligned = false
		}

		// Reverse array
		this._barrageEvents.unshift(barrageEvent)
	}

	_onStWeaponskillDamage(event) {
		if (this._lastStWeaponskill.length && this.util.timeSince(this._lastStWeaponskill[0]) <= TRIPLE_HIT_BUFFER && this._lastStWeaponskill[0].ability.guid === event.ability.guid) {

			this._lastStWeaponskill.push(event)

			if (this._lastStWeaponskill.length === STATUSES.BARRAGE.amount) {
				this._barrageEvents[0].skillBarraged = event.ability.guid
				this._barrageEvents[0].damageEvents = this._lastStWeaponskill.slice()

				this._lastStWeaponskill = []
			}

		} else {
			this._lastStWeaponskill = []
			this._lastStWeaponskill.push(event)
		}
	}

	_onDeath() {
		if (this._barrageEvents.length
			&& !this._barrageEvents.skillBarraged
			&& this.util.timeSince(this._barrageEvents[0]) < STATUSES.BARRAGE.duration + BARRAGE_BUFFER) {

			this._cuckedByDeath.push(this._barrageEvents[0])

		}
	}

	_onComplete() {
		const badBarrages = this._barrageEvents.filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) && x.aligned)
		const unalignedBarrages = this._barrageEvents.filter(x => !BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) && !x.aligned)
		const worstBarragesNA = this._barrageEvents.filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) && !x.aligned)

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
		const badBarrages = this._barrageEvents.reverse()

		if (badBarrages.length === 0) {
			return
		}

		const panels = badBarrages.map(barrage => {

			const panel = new BarragePanel({
				barrage: barrage,
				title: null,
				headers: [],
				contents: [],
				util: this.util,
			})
			if (BAD_ST_WEAPONSKILLS.includes(barrage.skillBarraged) || !barrage.aligned) {

				const totalDamage = barrage.damageEvents.reduce((x, y) => x + y.amount, 0)
				const totalDPS = this.util.formatDecimal(totalDamage * 1000 / this.parser.fightDuration)

				let potentialDamage = totalDamage
				let potentialEmpyrealDamage = Math.trunc(ACTIONS.EMPYREAL_ARROW.potency * totalDamage / getAction(barrage.skillBarraged).potency)
				let potentialRefulgentDamage = Math.trunc(ACTIONS.REFULGENT_ARROW.potency * totalDamage / getAction(barrage.skillBarraged).potency)

				if (!barrage.aligned) {

					// Applies RS modifier
					potentialEmpyrealDamage = Math.trunc(potentialEmpyrealDamage * (1 +STATUSES.RAGING_STRIKES.amount))
					potentialRefulgentDamage = Math.trunc(potentialRefulgentDamage * (1 +STATUSES.RAGING_STRIKES.amount))
					potentialDamage = Math.trunc(potentialDamage * (1 + STATUSES.RAGING_STRIKES.amount))

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

				const potentialDPS = this.util.formatDecimal(potentialDamage * 1000 / this.parser.fightDuration)
				const potentialEmpyrealDPS = this.util.formatDecimal(potentialEmpyrealDamage * 1000 / this.parser.fightDuration)
				const potentialRefulgentDPS = this.util.formatDecimal(potentialRefulgentDamage * 1000 / this.parser.fightDuration)

				let dpsLoss = this.util.formatDecimal(potentialDPS - totalDPS)

				if (BAD_ST_WEAPONSKILLS.includes(barrage.skillBarraged)) {

					potentialDamage = `${potentialEmpyrealDamage} - ${potentialRefulgentDamage}`
					dpsLoss = `${this.util.formatDecimal(potentialEmpyrealDPS - totalDPS)} - ${this.util.formatDecimal(potentialRefulgentDPS- totalDPS)}`

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

			return panel.build()

		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}

class BarrageEvent {

	castEvent = null

	skillBarraged = null
	damageEvents = []

	// Assuming barrage was aligned with Raging Strikes. Will set to false if determined otherwise
	aligned = true

	get timestamp() {
		return this.castEvent && this.castEvent.timestamp
	}
}

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

class BarrageRequirement extends Requirement {

	constructor(options) {
		super({
			weight: 1,
			...options,
		})
	}

}

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

	get severity() {
		return this.headers.length ? this._severitySelector(this.headers.map(h => h.severity)) : SUCCESS
	}

	build() {

		const issueElements = this.headers && this.headers.length && this.headers.map(h => {
			return h.issue && <Message key={this.headers.indexOf(h)} error={h.severity === ERROR} warning={h.severity === WARNING} success={h.severity === SUCCESS}>
				<Icon name={SEVERITY[h.severity].icon}/>
				<span>{h.issue}</span>
			</Message>
		}) || undefined

		const reasonElements = this.headers && this.headers.length && <div className={styles.description}>
			<List bulleted relaxed>
				{ this.headers.map(h => {
					return <List.Item key={this.headers.indexOf(h)}>{h.reason}</List.Item>
				})
				}
			</List>
		</div> || undefined

		const contentElements = this.contents && this.contents.length && this.contents.map(c => {
			return <Fragment key={this.contents.indexOf(c)}>
				{c}
			</Fragment>
		}) || undefined

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

	_severitySelector(severities) {
		const severity = Math.min(...severities.map(s => s || 0))

		return severity !== 0 ? severity : undefined
	}
}

