import CoreWeaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'

const MUDRA = [
	ACTIONS.TEN.id,
	ACTIONS.CHI.id,
	ACTIONS.JIN.id,
]

const NINJUTSU = [
	ACTIONS.FUMA_SHURIKEN.id,
	ACTIONS.KATON.id,
	ACTIONS.GOKA_MEKKYAKU.id,
	ACTIONS.RAITON.id,
	ACTIONS.HYOTON.id,
	ACTIONS.HYOSHO_RANRYU.id,
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

const MAX_NINJUTSU_PER_TCJ = 3

export default class Weaving extends CoreWeaving {
	_lastDwadTimestamp = 0 // A necessary evil - logs go janky sometimes and have 3 cast events for a single DWaD
	isBadWeave(weave/*, maxWeaves*/) {
		let weaveCount = 0
		let checkState = STATE.NORMAL
		let tcjCount = 0
		let ninjutsuCounted = false
		let dreams = 0

		for (let i = 0; i < weave.weaves.length; i++) {
			const abilityId = weave.weaves[i].ability.guid
			if (abilityId === ACTIONS.TEN_CHI_JIN.id) {
				// Switch to TCJ mode, so we ignore the next 3 ninjutsu cast (unless we reset to state 0)
				checkState = STATE.TCJ
				ninjutsuCounted = true
				weaveCount++
			} else if (MUDRA.includes(abilityId)) {
				if (checkState === STATE.NORMAL) {
					// Switch to standard ninjutsu mode if we're in normal mode, burn otherwise
					checkState = STATE.NINJUTSU
					ninjutsuCounted = true
					weaveCount++
				}
			} else if (NINJUTSU.includes(abilityId)) {
				if (checkState === STATE.NINJUTSU) {
					// Standard ninjutsu; increment the count and reset the state to 0
					checkState = STATE.NORMAL
				} else if (checkState === STATE.TCJ) {
					// TCJ mode; if this is the third ninjutsu, behave as above, otherwise burn
					if (++tcjCount >= MAX_NINJUTSU_PER_TCJ) {
						tcjCount = 0
						checkState = STATE.NORMAL
					}
				}
			} else {
				if (abilityId === ACTIONS.DREAM_WITHIN_A_DREAM.id) {
					dreams++
				}

				// Switch to normal mode and reset the TCJ count in case it was manually interrupted
				tcjCount = 0
				checkState = STATE.NORMAL
				weaveCount++
			}
		}

		if (ninjutsuCounted) {
			// If a Ninjutsu was used, we only permit single weaves; otherwise, double is fine
			return weaveCount > 1
		}

		if (dreams > 1) {
			// We had duplicate DWaD events; only one is actually valid, so remove dreams - 1 from the count to dedupe and test that
			return (weaveCount - (dreams - 1)) > 2
		}

		return super.isBadWeave(weave, 2)
	}
}
