import Weaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'

const MUDRA = [
	ACTIONS.TEN.id,
	ACTIONS.CHI.id,
	ACTIONS.JIN.id,
]

const NINJUTSU = [
	ACTIONS.FUMA_SHURIKEN.id,
	ACTIONS.KATON.id,
	ACTIONS.RAITON.id,
	ACTIONS.HYOTON.id,
	ACTIONS.HUTON.id,
	ACTIONS.DOTON.id,
	ACTIONS.SUITON.id,
	ACTIONS.RABBIT_MEDIUM.id,
]

const STATE = {
	NORMAL: 0,
	NINJUTSU: 1,
	TCJ: 2,
}

export default class NinWeaving extends Weaving {
	isBadWeave(weave, maxWeaves) {
		let weaveCount = 0
		let checkState = STATE.NORMAL
		let tcjCount = 0
		let ninjutsuCounted = false

		for (let i = 0; i < weave.weaves.length; i++) {
			const abilityId = weave.weaves[i].ability.guid
			if (abilityId === ACTIONS.TEN_CHI_JIN.id) {
				// Switch to TCJ mode, so we ignore the next 3 ninjutsu cast (unless we reset to state 0)
				checkState = STATE.TCJ
				weaveCount++
			} else if (MUDRA.includes(abilityId)) {
				if (checkState === STATE.NORMAL) {
					// Switch to standard ninjutsu mode if we're in normal mode, burn otherwise
					checkState = STATE.NINJUTSU
					weaveCount++
				}
			} else if (NINJUTSU.includes(abilityId)) {
				if (checkState === STATE.NINJUTSU) {
					// Standard ninjutsu; increment the count and reset the state to 0
					ninjutsuCounted = true
					checkState = STATE.NORMAL
				} else if (checkState === STATE.TCJ) {
					// TCJ mode; if this is the third ninjutsu, behave as above, otherwise burn
					if (++tcjCount >= 3) {
						tcjCount = 0
						ninjutsuCounted = true
						checkState = STATE.NORMAL
					}
				}
			} else {
				// Switch to normal mode and reset the TCJ count in case it was manually interrupted
				tcjCount = 0
				checkState = STATE.NORMAL
				weaveCount++
			}
		}

		if (ninjutsuCounted) {
			return weaveCount > 1
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
