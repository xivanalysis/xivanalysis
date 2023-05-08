import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Weaving, Weave} from 'parser/core/modules/Weaving'
import React from 'react'

const TO_MILLISECONDS = 1000
const MAX_SURPANAKHA_CHARGES = 4

const MAX_ALLOWED_MULTIWEAVE_DURING_MOON_FLUTE = 6

// Surpanakha has four charges, and each it is pressed, it gives
// a buff that increases the damage of the next Surpanakha, but
// ONLY if no other action is used.
// That "no other action" is EXTREMELY strict.  No GCD, no oGCDs,
// no items, no sprint.
//
// Each Surpanakha cast is *roughly* ~850ms, assuming little latency;
// this module uses a flat 1000ms to accommodate for typical latency.
//
// Additionally, the standard opener has us doing a very
// funny HEXAWEAVE (Swift, Glass Dance, Surpanakha x4) so
// we need to except that specific situation too.
//

export class BLUWeaving extends Weaving {
	private badSurpanakhaSequence = 0

	@dependency private actors!: Actors

	override initialise() {
		super.initialise()
		this.addEventHook(filter<Event>().type('complete'), this.onCompleteExtra)
	}

	override getMaxWeaves(weave: Weave) {
		let surpanakhas = 0
		let foundBadSurpanakhaSequence = false
		const weaves: Array<Events['action']> = weave.weaves
		weaves.forEach(weave => {
			if (weave.action === this.data.actions.SURPANAKHA.id) {
				surpanakhas++
			} else if (surpanakhas >=1 && surpanakhas < MAX_SURPANAKHA_CHARGES) {
				foundBadSurpanakhaSequence = true
			}
		})

		if (foundBadSurpanakhaSequence || (surpanakhas && surpanakhas !== MAX_SURPANAKHA_CHARGES)) {
			this.badSurpanakhaSequence++
		}

		if (surpanakhas && !foundBadSurpanakhaSequence && weaves.length > surpanakhas && weaves.length <= MAX_ALLOWED_MULTIWEAVE_DURING_MOON_FLUTE) {
			// We got four Surpanakhas, they were correctly used in sequence, but there's
			// more to this weave window.
			// If the weave happened after the final Surpanakha then they're unnecessarily
			// clipping their next GCD, so we'll fall through and give them a suggestion
			// based on that
			if (weaves[weaves.length - 1].action === this.data.actions.SURPANAKHA.id) {
				// ...but here's the other alternative.  They did the four Surpanakhas at
				// the end of the weave slot.  IF they are following the standard opener,
				// then they did something like this:
				//      Bristle (Swiftcast, Glass Dance, Surpanakha x4)
				// So let's be understanding.  During a Moon Flute window, single or
				// double weaving *before* the Surpanakhas is potentially fine.
				if (this.actors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id)) {
					// Continue the handwavey assumption that any weave takes 1000ms
					const extraWeaveTimeMs = TO_MILLISECONDS * (weaves.length + 1)
					if (weave.gcdTimeDiff < extraWeaveTimeMs) {
						return weaves.length
					}
				}
			}
		}

		// Otherwise, we only accept Surpanakha when it is not weaved with anything else.
		if (surpanakhas &&
			weaves.length === surpanakhas &&
			weave.gcdTimeDiff < (surpanakhas + 1) * TO_MILLISECONDS) {
			return surpanakhas
		}

		return super.getMaxWeaves(weave)
	}

	private onCompleteExtra() {
		// Give a suggestion for people who didn't use Surpanakha x4, losing the buff and
		// a bunch of damage.
		//
		// There's an edge case here -- Some fights you may want to delay your Moon Flute window by
		// 30 seconds, at which point you might as well use a single charge of Surpanakha rather than
		// having it go to waste.
		//
		// But if people are clever & skilled enough to do that kind of optimization, then they're
		// clever enough to understand that they can disregarding the misfiring message.
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SURPANAKHA.icon,
			content: <Trans id="blu.weaving.bad_surpanakha.content">
				Use all four <DataLink action="SURPANAKHA" /> charges at the same time, with no other actions in-between.  Even <DataLink action="SPRINT" showIcon={false} /> or using an item will cancel the buff.
			</Trans>,
			why: <Trans id="blu.weaving.bad_surpanakha.why">
				<Plural value={this.badSurpanakhaSequence ?? 0} one="# Surpanakha chain" other="# Surpanakha chains" /> dropped the buff early.
			</Trans>,
			tiers: {1: SEVERITY.MAJOR},
			value: this.badSurpanakhaSequence,
		}))
	}
}

