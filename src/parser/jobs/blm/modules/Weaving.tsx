import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {Weave, Weaving as CoreWeaving} from 'parser/core/modules/Weaving'
import {FIRE_SPELLS, ICE_SPELLS} from './Elements'
import {Gauge, MAX_ASTRAL_UMBRAL_STACKS} from './Gauge'

const OGCD_EXCEPTIONS: ActionKey[] = [
	'LUCID_DREAMING',
	'ADDLE',
	'SURECAST',
	'TRANSPOSE',
]

const OPENER_TIME_THRESHOLD = 10000
const OPENER_EXCEPTIONS: ActionKey[] = [
	'TRIPLECAST',
]

export class Weaving extends CoreWeaving {
	private ogcdIds = OGCD_EXCEPTIONS.map(key => this.data.actions[key].id)
	private openerIds = OPENER_EXCEPTIONS.map(key => this.data.actions[key].id)

	@dependency private gauge!: Gauge

	private iceSpellIds = ICE_SPELLS.map(key => this.data.actions[key].id)
	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)

	override getMaxWeaves(weave: Weave) {
		const baseMaxWeaves = super.getMaxWeaves(weave)

		return Math.max(this.getAllowedClippingWeaves(weave), baseMaxWeaves)
	}

	private getAllowedClippingWeaves(weave: Weave) {
		if (weave.weaves.some(weave => this.ogcdIds.includes(weave.action))) {
			return 1
		}
		if (
			weave.weaves.some(weave => this.openerIds.includes(weave.action)
			&& weave.timestamp - this.parser.pull.timestamp < OPENER_TIME_THRESHOLD)
		) {
			return 1
		}
		const gaugeState = this.gauge.getGaugeState(weave.leadingGcdEvent?.timestamp)
		const leadingAction = weave.leadingGcdEvent?.action ?? 0
		if (this.iceSpellIds.includes(leadingAction) && gaugeState?.astralFire === MAX_ASTRAL_UMBRAL_STACKS ||
			this.fireSpellIds.includes(leadingAction) && gaugeState?.umbralIce === MAX_ASTRAL_UMBRAL_STACKS) {
			return 1
		}
		return 0
	}
}
