import {Action} from 'data/ACTIONS'
import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// Explaination for Jank:
// Reaper's bonus postionals as of patch 7.05 are as follows:
// No Buffs + no positionals = 0 %
// Buffs +positional = 7%
// Buffs + no positional = 0%
// No Buffs + positional = 7%

// To combat the fact that a buff postional and a non buff positional share the same bonusPercent,
// I have override postionalhit to compare the bonus percent to POSTIONAL_HIT_BONUS_PERCENTS and return true false.
// The Reaver module will cover the missed potency from the missing buff.

const POSITIONAL_HIT_BONUS_PERCENTS = 7
export class Positionals extends CorePositionals {
	static override displayOrder = DISPLAY_ORDER.POSITIONALS

	positionals = [
		this.data.actions.GIBBET,
		this.data.actions.GALLOWS,
		this.data.actions.EXECUTIONERS_GIBBET,
		this.data.actions.EXECUTIONERS_GALLOWS,
	]

	protected override positionalHit(action: Action, bonusPercent: number): boolean {
		//Check Executioner versions if they match the hit bonus
		if (action === this.data.actions.EXECUTIONERS_GALLOWS) {
			if (bonusPercent === POSITIONAL_HIT_BONUS_PERCENTS) {
				return true
			}
			return false

		}
		if (action === this.data.actions.EXECUTIONERS_GIBBET) {
			if (bonusPercent === POSITIONAL_HIT_BONUS_PERCENTS) {
				return true
			}
			return false

		}
		//Everything Else
		return !this.missedPositionalBonusPercents(action).includes(bonusPercent)
	}
}
