/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import Module from '../../core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS, {getAction} from 'data/ACTIONS'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

const BARRAGE_BUFFER = 700
const TRIPLE_HIT_BUFFER = 500
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
		'suggestions',
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
		if (!this.combatants.selected.hasStatus(STATUSES.RAGING_STRIKES.id) && this._timeUntilFinish(event) >= ACTIONS.BARRAGE.cooldown * 1000) {
			barrageEvent.aligned = false
		}

		// Reverse array
		this._barrageEvents.unshift(barrageEvent)
	}

	_onStWeaponskillDamage(event) {
		if (this._lastStWeaponskill.length && this._timeSince(this._lastStWeaponskill[0]) <= TRIPLE_HIT_BUFFER && this._lastStWeaponskill[0].ability.guid === event.ability.guid) {

			this._lastStWeaponskill.push(event)

			if (this._lastStWeaponskill.length === 3) {
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
			&& this._timeSince(this._barrageEvents[0]) < STATUSES.BARRAGE.duration + BARRAGE_BUFFER) {

			this._cuckedByDeath.push(this._barrageEvents[0])

		}
	}

	_onComplete() {
		const unalignedPercentage = this._unalignedBarrages.length && this._barrageCasts.length && (this._unalignedBarrages.length / this._barrageCasts.length) * 100
		const badBarrages = this._barrageEvents.filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged))

		if (badBarrages && badBarrages.length) {
			this.checklist.add(new Rule({
				name: 'Bad Barrages',
				description: <Fragment>
					Your two strongest weaponskills are <ActionLink {...ACTIONS.EMPYREAL_ARROW} /> and <ActionLink {...ACTIONS.REFULGENT_ARROW} />. Make sure you only use your Barrage on these two skills.
				</Fragment>,
				target: 100,
				requirements: [
					new Requirement({
						name: <Fragment><ActionLink {...ACTIONS.BARRAGE} />s well-used</Fragment>,
						percent: () => { return 100 - badBarrages.length * 100 / this._barrageEvents.length },
					}),
				],
			}))
		}

		if (unalignedPercentage) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.BARRAGE.icon,
				content: <Fragment>
					Both {ACTIONS.BARRAGE.name} and <ActionLink {...ACTIONS.RAGING_STRIKES} /> have a cooldown of {ACTIONS.BARRAGE.cooldown} seconds. Keeping them aligned is often better than holding onto {ACTIONS.BARRAGE.name}.
				</Fragment>,
				severity: unalignedPercentage <= 20 ? SEVERITY.MINOR : unalignedPercentage <= 50 ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{this._unalignedBarrages.length} instances of unaligned {ACTIONS.BARRAGE.name} casts.
				</Fragment>,
			}))
		}
	}

	output() {
		const badBarrages = this._barrageEvents.reverse().filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged) || x.aligned === false)

		if (badBarrages.length === 0) {
			return
		}

		const panels = badBarrages.map(barrage => {

			const panel = {
				key: null,
				title: null,
				content: null,
			}
			panel.key = barrage.timestamp

			if (BAD_ST_WEAPONSKILLS.includes(barrage.skillBarraged)) {
				const totalDamage = barrage.damageEvents.reduce((x, y) => x + y.amount, 0)
				const totalEmpyrealEquivalent = Math.trunc(ACTIONS.EMPYREAL_ARROW.potency * totalDamage / getAction(barrage.skillBarraged).potency)
				const totalRefulgentEquivalent = Math.trunc(ACTIONS.REFULGENT_ARROW.potency * totalDamage / getAction(barrage.skillBarraged).potency)

				const totalDPS = this._formatDecimal(totalDamage*1000/this.parser.fightDuration)
				const totalEmpyrealDPS = this._formatDecimal(totalEmpyrealEquivalent*1000/this.parser.fightDuration)
				const totalRefulgentDPS = this._formatDecimal(totalRefulgentEquivalent*1000/this.parser.fightDuration)

				panel.title = {
					content: <Fragment>
						{this.parser.formatTimestamp(barrage.timestamp)} - {ACTIONS.BARRAGE.name} used on <ActionLink {...getAction(barrage.skillBarraged)} />.
					</Fragment>,
				}

				panel.content = {
					content: <Fragment>
						<p>Total damage: {totalDamage}</p>
						<p>Potential damage: {totalEmpyrealEquivalent} - {totalRefulgentEquivalent}</p>
						<p>DPS loss: {this._formatDecimal(totalEmpyrealDPS-totalDPS)} - {this._formatDecimal(totalRefulgentDPS-totalDPS)}</p>
					</Fragment>,
				}
			// If it's not a bad single target skill, then it was unaligned
			} else {
				panel.title = {
					content: <Fragment>
						{this.parser.formatTimestamp(barrage.timestamp)} - {ACTIONS.BARRAGE.name} not aligned with <ActionLink {...ACTIONS.RAGING_STRIKES} />.
					</Fragment>,
				}
			}

			return panel

		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}

	_timeUntilFinish(event) {
		return this.parser.fight.end_time - event.timestamp
	}

	_timeSince(event) {
		return this.parser.currentTimestamp - event.timestamp
	}

	_formatDecimal(number) {
		return Math.trunc(number*100)/100
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
