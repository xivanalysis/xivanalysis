import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Kassatsu extends Analyser {
	static override handle = 'kassatsu'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private kassatsuSpent: boolean = false
	private kassatsuWastes: number = 0
	private kassatsuUses: {[key: number]: number} = {
		[this.data.actions.FUMA_SHURIKEN.id]: 0,
		[this.data.actions.GOKA_MEKKYAKU.id]: 0,
		[this.data.actions.RAITON.id]: 0,
		[this.data.actions.HYOSHO_RANRYU.id]: 0,
		[this.data.actions.HUTON.id]: 0,
		[this.data.actions.DOTON.id]: 0,
		[this.data.actions.SUITON.id]: 0,
		[this.data.actions.RABBIT_MEDIUM.id]: 0,
	}

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(Object.keys(this.kassatsuUses).map(Number))), this.onNinjutsuCast)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.KASSATSU.id), this.onRemoveKassatsu)
		this.addEventHook('complete', this.onComplete)
	}

	private onNinjutsuCast(event: Events['action']) {
		const abilityId = event.action
		if (this.actors.current.hasStatus(this.data.statuses.KASSATSU.id)) {
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
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.KASSATSU.icon,
			content: <Trans id="nin.kassatsu.suggestions.waste.content">
				Be careful not to let <ActionLink action="KASSATSU"/> fall off, as it wastes a 30% potency buff and means that you're delaying your Ninjutsu casts significantly.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.kassatsuWastes,
			why: <Trans id="nin.kassatsu.suggestions.waste.why">
				You allowed Kassatsu to fall off <Plural value={this.kassatsuWastes} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HUTON.icon,
			content: <Trans id="nin.kassatsu.suggestions.huton.content">
				Avoid using <ActionLink action="HUTON"/> under <ActionLink action="KASSATSU"/> unless using it to set up for a critically important <ActionLink action="KUNAIS_BANE"/> on 3 or more targets. It's generally best to use it on <ActionLink action="HYOSHO_RANRYU"/> while Kunai's Bane is up, as its cooldown should align it with every window.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.kassatsuUses[this.data.actions.HUTON.id],
			why: <Trans id="nin.kassatsu.suggestions.huton.why">
				You cast Huton <Plural value={this.kassatsuUses[this.data.actions.HUTON.id]} one="# time" other="# times"/> under Kassatsu.
			</Trans>,
		}))

		const generalBads = this.kassatsuUses[this.data.actions.FUMA_SHURIKEN.id] + this.kassatsuUses[this.data.actions.RAITON.id] + this.kassatsuUses[this.data.actions.DOTON.id]
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FUMA_SHURIKEN.icon,
			content: <Trans id="nin.kassatsu.suggestions.generalbads.content">
				Avoid using <ActionLink action="FUMA_SHURIKEN"/>, <ActionLink action="RAITON"/>, and <ActionLink action="DOTON"/> under <ActionLink action="KASSATSU"/>. For raw damage, <ActionLink action="HYOSHO_RANRYU"/> and <ActionLink action="GOKA_MEKKYAKU"/> should always be used in single-target and AoE situations respectively.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: generalBads,
			why: <Trans id="nin.kassatsu.suggestions.generalbads.why">
				You cast standard damaging Ninjutsu <Plural value={generalBads} one="# time" other="# times"/> under Kassatsu.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SUITON.icon,
			content: <Trans id="nin.kassatsu.suggestions.suiton.content">
				Avoid using <ActionLink action="SUITON"/> under <ActionLink action="KASSATSU"/> unless using it to set up for a critically important <ActionLink action="KUNAIS_BANE"/>. It's generally best to use it on <ActionLink action="HYOSHO_RANRYU"/> while Kunai's Bane is up, as its cooldown should align it with every window.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
			},
			value: this.kassatsuUses[this.data.actions.SUITON.id],
			why: <Trans id="nin.kassatsu.suggestions.suiton.why">
				You cast Suiton <Plural value={this.kassatsuUses[this.data.actions.SUITON.id]} one="# time" other="# times"/> under Kassatsu.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RABBIT_MEDIUM.icon,
			content: <Trans id="nin.kassatsu.suggestions.rabbit.content">
				Be especially careful not to flub your mudras under <ActionLink action="KASSATSU"/>, as <ActionLink action="RABBIT_MEDIUM"/> does no damage and completely wastes the 30% potency buff Kassatsu provides.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.kassatsuUses[this.data.actions.RABBIT_MEDIUM.id],
			why: <Trans id="nin.kassatsu.suggestions.rabbit.why">
				You cast Rabbit Medium <Plural value={this.kassatsuUses[this.data.actions.RABBIT_MEDIUM.id]} one="# time" other="# times"/> under Kassatsu.
			</Trans>,
		}))
	}
}
