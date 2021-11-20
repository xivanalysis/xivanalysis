import JOBS from 'data/JOBS'
import {Attribute} from 'event'
import {Actor} from 'report'
import {getEstimatedTime} from 'utilities/speedStatMapper'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Actors} from './Actors'

type SpeedAttribute = Attribute.SKILL_SPEED | Attribute.SPELL_SPEED

export class SpeedAdjustments extends Analyser {
	static override handle = 'speedAdjustments'

	@dependency private actors!: Actors

	getAdjustedDuration({
		duration,
		attribute = JOBS[this.parser.actor.job].speedStat,
		actor = this.parser.actor.id,
	}: {
		duration: number,
		attribute?: SpeedAttribute,
		actor?: Actor['id']
	}) {
		// TODO: Pull the full algorithm in here, and track actions that adjust speeds
		//       to plug into it.
		const attrValue = this.actors.get(actor).attributes[attribute]
		return getEstimatedTime(attrValue.value, duration)
	}
}
