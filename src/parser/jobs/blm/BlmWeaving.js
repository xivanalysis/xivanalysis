import Weaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'


const OGCDExceptions = [
	ACTIONS.LUCID_DREAMING.id,
	ACTIONS.ADDLE.id,
	ACTIONS.SURECAST.id,
	ACTIONS.APOCATASTASIS.id,
	ACTIONS.MANA_SHIFT.id,
]

export default class BlmWeaving extends Weaving {
	static handle = 'weaving'
	static dependencies = [
		'castTime',
		'invuln',
		'suggestions',
		'gauge',
	]

	//AF3/UI3 checks
	_AF3 = false
	_UI3 = false

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
	}

	//check whether we are in UI3/AF3 precast
	_onBegin() {
		if (this.gauge.getUI() === 3) {
			this._UI3 = true
		}
		if (this.gauge.getAF() === 3) {
			this._AF3 = true
		}
	}

	//check for fast casted F3/B3 and allow 1 weave if you get one
	isBadWeave(weave, maxWeaves) {
		if (weave.gcdEvent.ability) {
			const weaveCount = weave.weaves.filter(
				event => !this.invuln.isUntargetable('all', event.timestamp)
			).length

			//allow a single weave of the OGCD exceptions
			if (weaveCount === 1 && OGCDExceptions.includes(weave.weaves[0].ability.guid)) {
				return false
			}

			//allow first eno to be ignored because it's a neccessary weave. 10s for that to happen because of O5s Eno delay.
			if (weaveCount === 1) {
				const ogcdTime = weave.weaves[0].timestamp - this.parser.fight.start_time
				if (ogcdTime < 10000 && weave.weaves[0].ability.guid === ACTIONS.ENOCHIAN.id) {
					return false
				}
			}

			//allow single weave under fast B3/F3
			if ((weave.gcdEvent.ability.guid === ACTIONS.FIRE_III.id && this._UI3) || (weave.gcdEvent.ability.guid === ACTIONS.BLIZZARD_III.id && this._AF3)) {
				if (weaveCount === 1) {
					return false
				}
			}
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
