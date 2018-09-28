/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import Module from '../../core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

const BARRAGE_BUFFER = 700
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
	ACTIONS.REFULGENT_ARROW,
].concat(BAD_ST_WEAPONSKILLS)

export default class Barrage extends Module {
	static handle = 'barrage'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_barrageCasts = []
	_barragedSkills = []
	_cuckedByDeath = []
	_droppedBarrages = []
	_unalignedBarrages = []

	_barrageEvent = {
		castEvent: null,
		skillBarraged: null,
		get timestamp() { this.castEvent && this.castEvent.timestamp },

	}

	constructor(...args) {
		super(...args)

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.BARRAGE.id,
		}

		const weaponskillFilter = {
			by: 'player',
			abilityId: WEAPONSKILLS,
		}

		const deathFilter = {
			to: 'player',
		}

		this.addHook('cast', castFilter, this._onBarrageCast)
		this.addHook('cast', weaponskillFilter, this._onWeaponskillCast)
		this.addHook('death', deathFilter, this._onDeath)
		this.addHook('complete', this._onComplete)

	}

	_onBarrageCast(event) {
		this._barrageCasts.push(event)

		// Ignores last use alignment
		if (!this.combatants.selected.hasStatus(STATUSES.RAGING_STRIKES.id) && this._timeUntilFinish(event) >= ACTIONS.BARRAGE.cooldown * 1000) {
			this._unalignedBarrages.push(event)
		}
	}

	_onWeaponskillCast(event) {
		if (this.combatants.selected.hasStatus(STATUSES.BARRAGE.id, event.timestamp, BARRAGE_BUFFER)) {
			this._barragedSkills.push(event)

			if (event.abilityId) {
				return
			}

		}
	}

	_onDeath(event) {
		if (this.combatants.selected.hasStatus(STATUSES.BARRAGE.id, event.timestamp, BARRAGE_BUFFER)) {
			this._cuckedByDeath.push(event)
		}
	}

	_onComplete() {
		const unalignedPercentage = this._unalignedBarrages.length && this._barrageCasts.length && (this._unalignedBarrages.length / this._barrageCasts.length) * 100

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
}
