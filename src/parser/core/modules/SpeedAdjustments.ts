import {JOBS} from 'data/JOBS'
import {Attribute} from 'event'
import {Actor} from 'report'
import {getSpeedStatAdjustedDuration} from 'utilities/speedStatMapper'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Actors} from './Actors'

export type SpeedAttribute = Attribute.SKILL_SPEED | Attribute.SPELL_SPEED

interface ActorAttributeSpecifier  {
	attribute?: SpeedAttribute,
	actor?: Actor['id']
}

export class SpeedAdjustments extends Analyser {
	static override handle = 'speedAdjustments'

	@dependency private actors!: Actors

	/**
	 * Get the specified duration adjusted by the current value of the provided
	 * actor's attribute. If not provided, the actor will default to the currently
	 * parsed actor, and the attribute to that actor's primary speed attribute.
	 * The value returned from this function _may_ be an estimate - check
	 * {@link SpeedAdjustments.isAdjustmentEstimated} to see if it is.
	 */
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

	/**
	 * Returns whether the speed adjustments performed for the specified actor
	 * attribute, defaulting to the currently parsed actor's primary speed attribute,
	 * are estimates.
	 */
	isAdjustmentEstimated(opts?: ActorAttributeSpecifier) {
		return this.getActorAttribute(opts).estimated
	}

	private getActorAttribute({
		attribute: maybeAttribute,
		actor: actorId = this.parser.actor.id,
	}: ActorAttributeSpecifier = {}) {
		const actor = this.actors.get(actorId)
		return actor.attributes[maybeAttribute ?? JOBS[actor.job].speedStat]
	}
}
