import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {BASE_GCD} from 'data/CONSTANTS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Weaving, Weave} from 'parser/core/modules/Weaving'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const MAX_CAST_TIME_FOR_SINGLE_WEAVE = 1500
const SINGLE_WEAVE_MS = 1000
const MAX_SURPANAKHA_CHARGES = 4

const MAX_ALLOWED_MULTIWEAVE_DURING_MOON_FLUTE = 6

// Surpanakha has four charges, and each it is pressed, it gives
// a buff that increases the damage of the next Surpanakha, but
// ONLY if no other action is used.
// That "no other action" is EXTREMELY strict. No GCD, no oGCDs,
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
	static override displayOrder = DISPLAY_ORDER.WEAVING
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

		// It is expected and intentional to clip GCDs during Moon Flute windows.
		if (this.actors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id)) {
			// The big case is multi-weaving with Surpanakha:
			if (surpanakhas && !foundBadSurpanakhaSequence && weaves.length > surpanakhas && weaves.length <= MAX_ALLOWED_MULTIWEAVE_DURING_MOON_FLUTE) {
				// We got four Surpanakhas, they were correctly used in sequence, but there's
				// more to this weave window.
				// If the weave happened after the final Surpanakha then they're unnecessarily
				// clipping their next GCD, so we'll fall through and give them a suggestion
				// based on that
				if (weaves[weaves.length - 1].action === this.data.actions.SURPANAKHA.id) {
					// ...but here's the other alternative. They did the four Surpanakhas at
					// the end of the weave slot. IF they are following the standard opener,
					// then they did something like this:
					//  Bristle (Swiftcast, Glass Dance, Surpanakha x4)
					// So let's be understanding. During a Moon Flute window, single or
					// double weaving *before* the Surpanakhas is potentially fine.
					// Continue the handwavey assumption that any weave takes 1000ms
					const extraWeaveTimeMs = SINGLE_WEAVE_MS * (weaves.length + 1)
					if (weave.gcdTimeDiff < extraWeaveTimeMs) {
						return weaves.length
					}
				}
			}

			// And the second case: To fit all the oGCDs we have, we hard-clip
			// 2s cast time GCDs during Moon Flute windows:
			if (weaves.length === 1 && weave.leadingGcdEvent !== undefined) {
				const castTime = this.castTime.forEvent(weave.leadingGcdEvent) ?? BASE_GCD
				const allowedWeaveClippingDuringMF = castTime + SINGLE_WEAVE_MS
				if (weave.gcdTimeDiff < allowedWeaveClippingDuringMF) {
					return weaves.length
				}
			}
		}

		// Otherwise, we only accept Surpanakha when it is not weaved with anything else.
		if (surpanakhas &&
			weaves.length === surpanakhas &&
			weave.gcdTimeDiff < (surpanakhas + 1) * SINGLE_WEAVE_MS) {
			return surpanakhas
		}

		// The default weaving module allows a single-weave after any spell with
		// a cast time between 1.5 and 2.5 -- But here we want to disallow weaving
		// after a 2s cast time GCD:
		if (weave.leadingGcdEvent !== undefined) {
			const castTime = this.castTime.forEvent(weave.leadingGcdEvent) ?? BASE_GCD
			if (castTime > MAX_CAST_TIME_FOR_SINGLE_WEAVE) {
				// 2s cast time spell, possibly a bit lower due to SpS; no weaves allowed
				return 0
			}
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
				Use all four <DataLink action="SURPANAKHA" /> charges at the same time, with no other actions in-between. Even <DataLink action="SPRINT" showIcon={false} /> or using an item will cancel the buff.
			</Trans>,
			why: <Trans id="blu.weaving.bad_surpanakha.why">
				<Plural value={this.badSurpanakhaSequence} one="# Surpanakha chain" other="# Surpanakha chains" /> dropped the buff early.
			</Trans>,
			tiers: {1: SEVERITY.MAJOR},
			value: this.badSurpanakhaSequence,
		}))
	}
}

