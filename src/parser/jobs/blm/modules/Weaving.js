import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Weaving from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {BLM_GAUGE_EVENT} from './Gauge'

const OGCD_EXCEPTIONS = [
	ACTIONS.LUCID_DREAMING.id,
	ACTIONS.ADDLE.id,
	ACTIONS.SURECAST.id,
	ACTIONS.TRANSPOSE.id,
]

const OPENER_TIME_THRESHHOLD = 10000
const OPENER_EXCEPTIONS = [
	ACTIONS.ENOCHIAN.id,
	ACTIONS.TRIPLECAST.id,
]

//max number of AFUI stacks
const MAX_BUFF_STACKS = 3

export default class BlmWeaving extends Weaving {
	static handle = 'weaving'
	static displayOrder = DISPLAY_ORDER.WEAVING

	static dependencies = [
		...Weaving.dependencies,
		'invulnerability',
		'gauge', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'castTime',
	]

	_astralFireStacks = 0
	_umbralIceStacks = 0

	_lastF3FastCast = false
	_lastB3FastCast = false

	_ctIndex = null

	constructor(...args) {
		super(...args)
		this.addEventHook(BLM_GAUGE_EVENT, this._onGaugeChange)
		this.addEventHook('begincast', {by: 'player', abilityId: ACTIONS.FIRE_III.id}, this._beginFire3)
		this.addEventHook('begincast', {by: 'player', abilityId: ACTIONS.BLIZZARD_III.id}, this._beginBlizzard3)
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.TRIPLECAST.id}, this._onApplyTriple)
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.TRIPLECAST.id}, this._onRemoveTriple)
	}

	_beginFire3() {
		this._lastF3FastCast = this._umbralIceStacks === MAX_BUFF_STACKS
	}
	_beginBlizzard3() {
		this._lastB3FastCast = this._astralFireStacks === MAX_BUFF_STACKS
	}

	_onGaugeChange(event) {
		this._astralFireStacks = event.astralFire
		this._umbralIceStacks = event.umbralIce
	}

	_onApplyTriple() {
		this._ctIndex = this.castTime.setFflogs('all', 0)
	}

	_onRemoveTriple() {
		this.castTime.resetFflogs(this._ctIndex)
	}

	//check for fast casted F3/B3 and allow 1 weave if you get one
	isBadWeave(weave, maxWeaves) {
		if (weave.leadingGcdEvent.ability) {
			const weaveCount = weave.weaves.filter(
				event => !this.invulnerability.isActive({
					timestamp: this.parser.fflogsToEpoch(event.timestamp),
					types: ['untargetable'],
				})
			).length

			//allow a single weave of the OGCD exceptions
			if (weaveCount === 1 && OGCD_EXCEPTIONS.includes(weave.weaves[0].ability.guid)) {
				return false
			}

			//allow certain actions to be ignored in openers because it can be a neccessary weave. 10s for that to happen because of O5s Eno delay.
			if (weaveCount === 1) {
				const ogcdTime = weave.weaves[0].timestamp - this.parser.fight.start_time
				if (ogcdTime < OPENER_TIME_THRESHHOLD && OPENER_EXCEPTIONS.includes(weave.weaves[0].ability.guid)) {
					return false
				}
			}

			//allow single weave under fast B3/F3
			if ((weave.leadingGcdEvent.ability.guid === ACTIONS.FIRE_III.id && this._lastF3FastCast) ||
				(weave.leadingGcdEvent.ability.guid === ACTIONS.BLIZZARD_III.id && this._lastB3FastCast)
			) {
				if (weaveCount === 1) {
					return false
				}
			}
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
