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


export default class NinWeaving extends Weaving {
	isBadWeave(weave, maxWeaves) {
		let weaveCount = 0, checkState = 0, tcjCount = 0, ninjutsuCounted = false
		for (let i = 0; i < weave.weaves.length; i++) {
			let abilityId = weave.weaves[i].ability.guid
			if (abilityId === ACTIONS.TEN_CHI_JIN.id) {
				// Switch to TCJ mode, so we ignore the next 3 ninjutsu cast (unless we reset to state 0)
				checkState = 2
				weaveCount++
			} else if (MUDRA.includes(abilityId)) {
				if (checkState === 0) {
					// Switch to standard ninjutsu mode if we're in normal mode, burn otherwise
					checkState = 1
					weaveCount++
				}
			} else if (NINJUTSU.includes(abilityId)) {
				if (checkState === 1) {
					// Standard ninjutsu; increment the count and reset the state to 0
					ninjutsuCounted = true
					checkState = 0
				} else if (checkState === 2) {
					// TCJ mode; if this is the third ninjutsu, behave as above, otherwise burn
					if (++tcjCount >= 3) {
						tcjCount = 0
						ninjutsuCounted = true
						checkState = 0
					}
				}
			} else {
				// Switch to normal mode and reset the TCJ count in case it was manually interrupted
				tcjCount = 0
				checkState = 0
				weaveCount++
			}
		}

		if (ninjutsuCounted) {
			return weaveCount > 1
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
