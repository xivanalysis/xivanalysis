import {JOBS} from 'data/JOBS'
import {SpeedAdjustments, SpeedAttribute} from 'parser/core/modules/SpeedAdjustments'
import {Actor} from 'report'

const GREASED_LIGHTNING_MODIFIER = 0.8

export class GreasedLightning extends SpeedAdjustments {
	override getAdjustedDuration({
		duration,
		attribute = JOBS[this.parser.actor.job].speedStat,
		actor = this.parser.actor.id,
	}: {
		duration: number,
		attribute?: SpeedAttribute,
		actor?: Actor['id']
	}) {
		// Safety check so that only the MNK is affected
		if (actor === this.parser.actor.id) {
			return super.getAdjustedDuration({duration, attribute, actor}) * GREASED_LIGHTNING_MODIFIER
		}

		return super.getAdjustedDuration({duration, attribute, actor})
	}
}
