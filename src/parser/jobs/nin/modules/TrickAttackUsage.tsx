import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const TA_COOLDOWN_MILLIS = ACTIONS.TRICK_ATTACK.cooldown
const OPTIMAL_GCD_COUNT = 5 // Opener should be Suiton > AE combo > SE before Trick

const MUDRAS = [
	ACTIONS.TEN.id,
	ACTIONS.TEN_KASSATSU.id,
	ACTIONS.CHI.id,
	ACTIONS.CHI_KASSATSU.id,
	ACTIONS.JIN.id,
	ACTIONS.JIN_KASSATSU.id,
]

export default class TrickAttackUsage extends Analyser {
	static override handle = 'taUsage'

	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions

	private taCasts: number[] = []
	private lostTime: number = 0
	private gcdCount: number = 0
	private castHook: EventHook = null

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.castHook = this.addEventHook(playerFilter.type('action'), this.onCast)
		this.addEventHook(playerFilter.type('action').action(ACTIONS.TRICK_ATTACK.id), this.onTrickAttack)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']) {
		const action = getDataBy(ACTIONS, 'id', event.action)
		if (event.timestamp >= this.parser.fight.start_time && action && action.onGcd && MUDRAS.indexOf(action.id) === -1) {
			// Don't count the individual mudras as GCDs for this - they'll make the count screw if Suiton wasn't set up pre-pull
			this.gcdCount++
		}
	}

	private onTrickAttack(event: Events['action']) {
		if (this.castHook !== null) {
			this.removeEventHook(this.castHook)
			this.castHook = null
		}

		if (this.taCasts.length > 0) {
			const lastCast = this.taCasts[this.taCasts.length - 1]
			const taAvailable = lastCast + TA_COOLDOWN_MILLIS
			const downtime = this.downtime.getDowntime(
				this.parser.fflogsToEpoch(taAvailable),
				this.parser.fflogsToEpoch(event.timestamp),
			)
			this.lostTime += Math.max((event.timestamp - taAvailable) - downtime, 0)
		}

		this.taCasts.push(event.timestamp)
	}

	private onComplete() {
		if (this.taCasts.length > 0) {
			const lastCast = this.taCasts[this.taCasts.length - 1]
			// lostTime is only the time they were actually holding it off CD, but we want to add in the CD time of the final cast for
			// calculating how many theoretical casts were lost. For example, 20s of holding + last cast 40s before the end of the fight
			// would mean that they could've squeezed in an extra cast with perfect timing.
			const lostCasts = Math.floor((this.lostTime + (this.parser.currentEpochTimestamp - lastCast)) / TA_COOLDOWN_MILLIS)
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.TRICK_ATTACK.icon,
				content: <Trans id="nin.ta-usage.suggestions.missed.content">
					Avoid holding <ActionLink {...ACTIONS.TRICK_ATTACK}/> for extended periods of time. It's typically ideal to use it as close to on cooldown as possible in order to keep it aligned with all the other raid buffs and personal burst windows, as well as maximizing the number of uses per fight.
				</Trans>,
				value: lostCasts,
				tiers: {
					1: SEVERITY.MEDIUM,
					2: SEVERITY.MAJOR,
				},
				why: <Trans id="nin.ta-usage.suggestions.missed.why">
					You delayed Trick Attack for a cumulative {this.parser.formatDuration(this.lostTime)}, costing you <Plural value={lostCasts} one="# potential use" other="# potential uses"/>.
				</Trans>,
			}))

			const distanceFromOptimal = Math.abs(OPTIMAL_GCD_COUNT - this.gcdCount)
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.TRICK_ATTACK.icon,
				content: <Trans id="nin.ta-usage.suggestions.opener.content">
					Avoid unconventional timings for your first <ActionLink {...ACTIONS.TRICK_ATTACK}/> of the fight in order to line it up with all the other raid and personal buffs. In most openers, Trick Attack should be weaved in approximately 8-9 seconds into the fight.
				</Trans>,
				value: distanceFromOptimal,
				tiers: {
					1: SEVERITY.MEDIUM,
					2: SEVERITY.MAJOR,
				},
				why: <Trans id="nin.ta-usage.suggestions.opener.why">
					Your first Trick Attack was <Plural value={this.gcdCount} one="# GCD" other="# GCDs"/> into your opener.
				</Trans>,
			}))
		} else {
			// WHY ARE YOU EVEN PLAYING THIS JOB
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TRICK_ATTACK.icon,
				content: <Trans id="nin.ta-usage.suggestions.none.content">
					<ActionLink {...ACTIONS.TRICK_ATTACK}/> is the single most powerful raid buff in your kit and should be used on cooldown, or as close to it as possible depending on the flow of the fight.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.ta-usage.suggestions.none.why">
					You didn't use Trick Attack once the entire fight.
				</Trans>,
			}))
		}
	}
}
