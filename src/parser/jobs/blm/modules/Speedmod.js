import CoreSpeedmod from 'parser/core/modules/Speedmod'

import STATUSES from 'data/STATUSES'
import {BLM_GAUGE_EVENT} from './Gauge'
import {FIRE_SPELLS, ICE_SPELLS} from './Elements'

const MAX_ASTRAL_UMBRAL_STACKS = 3
const FAST_CAST_SCALAR = 0.5

export default class Speedmod extends CoreSpeedmod {
	static dependencies = [
		...CoreSpeedmod.dependencies,
		'gauge', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	_astralFireStacks = 0
	_umbralIceStacks = 0

	_isFastCast = false

	constructor(...args) {
		super(...args)
		this.SPEED_BUFF_STATUS_IDS.push(
			STATUSES.CIRCLE_OF_POWER.id, // Ley Lines buff
		)
	}

	jobSpecificNormaliseLogic(event) {
		const types = [BLM_GAUGE_EVENT, 'begincast', 'cast']

		if (!types.includes(event.type)) {
			return
		}

		switch (event.type) {
		case BLM_GAUGE_EVENT:
			this._astralFireStacks = event.astralFire
			this._umbralIceStacks = event.umbralIce
			break
		case 'begincast':
			if ((this._umbralIceStacks === MAX_ASTRAL_UMBRAL_STACKS && FIRE_SPELLS.includes(event.ability.guid)) ||
				(this._astralFireStacks === MAX_ASTRAL_UMBRAL_STACKS && ICE_SPELLS.includes(event.ability.guid))
			) {
				this._isFastCast = true
				this.recalcSpeedmodAndSaveHistory(event)
			}
			break
		case 'cast':
			if (this._isFastCast) {
				this._isFastCast = false
				this.recalcSpeedmodAndSaveHistory(event)
			}
			break
		}
	}

	getJobAdditionalSpeedbuffScalar() {
		if (this._isFastCast) {
			return FAST_CAST_SCALAR
		}
		return 1.0
	}
}
