/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import Module from '../../core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
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
	_lastStWeaponskill = {
		event: null,
		count: 0,
	}

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

		// Checks for alignment and ignores last use alignment
		if (!this.combatants.selected.hasStatus(STATUSES.RAGING_STRIKES.id) && this._timeUntilFinish(event) >= ACTIONS.BARRAGE.cooldown * 1000) {
			barrageEvent.aligned = false
		}

		// Reverse array
		this._barrageEvents.unshift(barrageEvent)
	}

	_onStWeaponskillDamage(event) {
		if (this._lastStWeaponskill.event && this._timeSince(this._lastStWeaponskill.event) <= TRIPLE_HIT_BUFFER) {

			if (this._lastStWeaponskill.event.ability.guid === event.ability.guid) {

				this._lastStWeaponskill.count++

				if (this._lastStWeaponskill.count === 3) {
					this._barrageEvents[0].skillBarraged = event

					this._lastStWeaponskill.event = null
					this._lastStWeaponskill.count = 0
				}
			}
		} else {
			this._lastStWeaponskill.event = event
			this._lastStWeaponskill.count = 1
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
		const badBarrages = this._barrageEvents.filter(x => BAD_ST_WEAPONSKILLS.includes(x.skillBarraged.ability.guid))

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

	_timeUntilFinish(event) {
		return this.parser.fight.end_time - event.timestamp
	}

	_timeSince(event) {
		return this.parser.currentTimestamp - event.timestamp
	}
}

class BarrageEvent {

	castEvent = null

	skillBarraged = null

	// Assuming barrage was aligned with Raging Strikes. Will set to false if determined otherwise
	aligned = true

	get timestamp() {
		this.castEvent && this.castEvent.timestamp
	}
}
