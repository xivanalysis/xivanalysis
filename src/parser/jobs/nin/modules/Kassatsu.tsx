import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class Kassatsu extends Analyser {
	static override handle = 'kassatsu'

	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	private kassatsuSpent: boolean = false
	private kassatsuWastes: number = 0
	private kassatsuUses: {[key: number]: number} = {
		[ACTIONS.FUMA_SHURIKEN.id]: 0,
		[ACTIONS.GOKA_MEKKYAKU.id]: 0,
		[ACTIONS.RAITON.id]: 0,
		[ACTIONS.HYOSHO_RANRYU.id]: 0,
		[ACTIONS.HUTON.id]: 0,
		[ACTIONS.DOTON.id]: 0,
		[ACTIONS.SUITON.id]: 0,
		[ACTIONS.RABBIT_MEDIUM.id]: 0,
	}

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('cast').action(oneOf(Object.keys(this.kassatsuUses).map(Number))), this.onNinjutsuCast)
		this.addEventHook(playerFilter.type('removebuff').status(STATUSES.KASSATSU.id), this.onRemoveKassatsu)
		this.addEventHook('complete', this.onComplete)
	}

	private onNinjutsuCast(event: Events['action']) {
		const abilityId = event.action
		if (this.actors.selected.hasStatus(STATUSES.KASSATSU.id)) {
			this.kassatsuUses[abilityId]++
			this.kassatsuSpent = true
		}
	}

	private onRemoveKassatsu() {
		if (!this.kassatsuSpent) {
			this.kassatsuWastes++
		}

		// Reset the flag for the next time it's cast
		this.kassatsuSpent = false
	}

	private onComplete() {
		if (this.kassatsuWastes > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.KASSATSU.icon,
				content: <Trans id="nin.kassatsu.suggestions.waste.content">
					Be careful not to let <ActionLink {...ACTIONS.KASSATSU}/> fall off, as it wastes a 30% potency buff and means that you're delaying your Ninjutsu casts significantly.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.waste.why">
					You allowed Kassatsu to fall off <Plural value={this.kassatsuWastes} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (this.kassatsuUses[ACTIONS.HUTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HUTON.icon,
				content: <Trans id="nin.kassatsu.suggestions.huton.content">
					Avoid using <ActionLink {...ACTIONS.HUTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>, as it does no damage and completely wastes the 30% potency buff Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.huton.why">
					You cast Huton <Plural value={this.kassatsuUses[ACTIONS.HUTON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		const generalBads = this.kassatsuUses[ACTIONS.FUMA_SHURIKEN.id] + this.kassatsuUses[ACTIONS.RAITON.id] + this.kassatsuUses[ACTIONS.DOTON.id]
		if (generalBads > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FUMA_SHURIKEN.icon,
				content: <Trans id="nin.kassatsu.suggestions.generalbads.content">
					Avoid using <ActionLink {...ACTIONS.FUMA_SHURIKEN}/>, <ActionLink {...ACTIONS.RAITON}/>, and <ActionLink {...ACTIONS.DOTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>. For raw damage, <ActionLink {...ACTIONS.HYOSHO_RANRYU}/> and <ActionLink {...ACTIONS.GOKA_MEKKYAKU}/> should always be used in single-target and AoE situations respectively.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.generalbads.why">
					You cast standard damaging Ninjutsu <Plural value={generalBads} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this.kassatsuUses[ACTIONS.SUITON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUITON.icon,
				content: <Trans id="nin.kassatsu.suggestions.suiton.content">
					Avoid using <ActionLink {...ACTIONS.SUITON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it to set up for a critically important <ActionLink {...ACTIONS.TRICK_ATTACK}/>. It's generally best to use it on <ActionLink {...ACTIONS.HYOSHO_RANRYU}/> while Trick Attack is up, as its cooldown should align it with every window.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.suiton.why">
					You cast Suiton <Plural value={this.kassatsuUses[ACTIONS.SUITON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this.kassatsuUses[ACTIONS.RABBIT_MEDIUM.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RABBIT_MEDIUM.icon,
				content: <Trans id="nin.kassatsu.suggestions.rabbit.content">
					Be especially careful not to flub your mudras under <ActionLink {...ACTIONS.KASSATSU}/>, as <ActionLink {...ACTIONS.RABBIT_MEDIUM}/> does no damage and completely wastes the 30% potency buff Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.rabbit.why">
					You cast Rabbit Medium <Plural value={this.kassatsuUses[ACTIONS.RABBIT_MEDIUM.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}
	}
}
