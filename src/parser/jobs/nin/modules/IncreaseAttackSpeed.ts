import {JOBS} from 'data/JOBS'
import {SpeedAdjustments, SpeedAttribute} from 'parser/core/modules/SpeedAdjustments'
import {Actor} from 'report'

const INCREASE_ATTACK_SPEED_MODIFIER = 0.85

export class IncreaseAttackSpeed extends SpeedAdjustments {
	override getAdjustedDuration({
		duration,
		attribute = JOBS[this.parser.actor.job].speedStat,
		actor = this.parser.actor.id,
	}: {
		duration: number,
		attribute?: SpeedAttribute,
		actor?: Actor['id']
	}) {
		// Safety check so that only the NIN is affected (yes this was shamelessly copied from the GreasedLightning MNK module)
		if (actor === this.parser.actor.id) {
			return super.getAdjustedDuration({duration, attribute, actor}) * INCREASE_ATTACK_SPEED_MODIFIER
		}

		return super.getAdjustedDuration({duration, attribute, actor})
	}
}
