import {JOBS} from 'data/JOBS'
import {Attribute} from 'event'
import {Actor} from 'report'
import {getSpeedStatAdjustedDuration} from 'utilities/speedStatMapper'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Actors} from './Actors'

export type SpeedAttribute = Attribute.SKILL_SPEED | Attribute.SPELL_SPEED

export class SpeedAdjustments extends Analyser {
	static override handle = 'speedAdjustments'

	@dependency private actors!: Actors

	getAdjustedDuration({
		duration,
		attribute: maybeAttribute,
		actor: actorId = this.parser.actor.id,
	}: {
		duration: number,
		attribute?: SpeedAttribute,
		actor?: Actor['id']
	}) {
		// TODO: Pull the full algorithm in here, and track actions that adjust speeds
		//       to plug into it.
		const actor = this.actors.get(actorId)
		const attribute = actor.attributes[maybeAttribute ?? JOBS[actor.job].speedStat]
		return getSpeedStatAdjustedDuration(attribute.value, duration)
	}
}
