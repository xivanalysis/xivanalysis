import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'

const LILY_CONSUMERS = [ACTIONS.ASSIZE.id, ACTIONS.DIVINE_BENISON.id, ACTIONS.ASYLUM.id, ACTIONS.TETRAGRAMMATON.id]
const LILY_GENERATORS = [ACTIONS.CURE.id, ACTIONS.CURE_II.id]
const COOLDOWN_REDUCTION = {
	0: 0,
	1: 0.04,
	2: 0.1,
	3: 0.2,
}

const MAX_LILIES = 3

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'cooldowns',
	]

	lilies = 0

	constructor(...args) {
		super(...args)

		this.addHook('heal', {by: 'player'}, this._onHeal)
		this.addHook('cast', {by: 'player'}, this._onCast)

	}

	_onHeal(event) {
		const abilityId = event.ability.guid
		if (LILY_GENERATORS.includes(abilityId)) {
			if (event.amount > 0) { this.lilies = Math.min(this.lilies + 1, MAX_LILIES) }
		}
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		if (LILY_CONSUMERS.includes(abilityId)) {
			//it depends on cooldowns, so it should be put on cooldown before this is handled here
			//not sure if cdr is floor or ceiling
			if (this.lilies > 0) {
				const reduction = Math.floor(getAction(abilityId).cooldown * COOLDOWN_REDUCTION[this.lilies])
				this.cooldowns.reduceCooldown(abilityId, reduction)
				this.parser.fabricateEvent({type: 'consumelilies', abilityId: abilityId, consumed: this.lilies, cooldownReduction: reduction})
			}
			//currently, all lily consumers consume them all
			this.lilies = 0
		}
	}
}
