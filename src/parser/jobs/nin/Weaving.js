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

const MAX_NINJUTSU_PER_TCJ = 3

export default class Weaving extends CoreWeaving {
	_lastDwadTimestamp = 0 // A necessary evil - logs go janky sometimes and have 3 cast events for a single DWaD
	isBadWeave(weave/*, maxWeaves*/) {
		let weaveCount = 0
		let checkState = STATE.NORMAL
		let tcjCount = 0
		let ninjutsuCounted = false
		let dwadDupe = false

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
					// Extra special DWaD sauce because ACT and/or fflogs are dumb, not sure which
					if (this._lastDwadTimestamp !== weave.weaves[i].timestamp) {
						// First DWaD in the weave, so update the timestamp we're tracking and count it
						this._lastDwadTimestamp = weave.weaves[i].timestamp
					} else {
						// A duplicate DWaD, don't even process this event as it shouldn't exist
						dwadDupe = true
						continue
					}
				}

				// Switch to normal mode and reset the TCJ count in case it was manually interrupted
				tcjCount = 0
				checkState = STATE.NORMAL
				weaveCount++
			}
		}

		if ((ninjutsuCounted || dwadDupe) && weaveCount === 1) {
			return false
		}

		return super.isBadWeave(weave, 1)
	}
}
