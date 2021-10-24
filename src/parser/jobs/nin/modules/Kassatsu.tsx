import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Kassatsu extends Module {
	static override handle = 'kassatsu'

	@dependency private combatants!: Combatants
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

	protected override init() {
		this.addEventHook('cast', {by: 'player', abilityId: Object.keys(this.kassatsuUses).map(Number)}, this.onNinjutsuCast)
		this.addEventHook('removebuff', {by: 'player', abilityId: this.data.statuses.KASSATSU.id}, this.onRemoveKassatsu)
		this.addEventHook('complete', this.onComplete)
	}

	private onNinjutsuCast(event: CastEvent) {
		const abilityId = event.ability.guid
		if (this.combatants.selected.hasStatus(this.data.statuses.KASSATSU.id)) {
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
				icon: this.data.actions.KASSATSU.icon,
				content: <Trans id="nin.kassatsu.suggestions.waste.content">
					Be careful not to let <ActionLink {...this.data.actions.KASSATSU}/> fall off, as it wastes a 30% potency buff and means that you're delaying your Ninjutsu casts significantly.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.waste.why">
					You allowed Kassatsu to fall off <Plural value={this.kassatsuWastes} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (this.kassatsuUses[this.data.actions.HUTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.HUTON.icon,
				content: <Trans id="nin.kassatsu.suggestions.huton.content">
					Avoid using <ActionLink {...this.data.actions.HUTON}/> under <ActionLink {...this.data.actions.KASSATSU}/>, as it does no damage and completely wastes the 30% potency buff Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.huton.why">
					You cast Huton <Plural value={this.kassatsuUses[this.data.actions.HUTON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		const generalBads = this.kassatsuUses[this.data.actions.FUMA_SHURIKEN.id] + this.kassatsuUses[this.data.actions.RAITON.id] + this.kassatsuUses[this.data.actions.DOTON.id]
		if (generalBads > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FUMA_SHURIKEN.icon,
				content: <Trans id="nin.kassatsu.suggestions.generalbads.content">
					Avoid using <ActionLink {...this.data.actions.FUMA_SHURIKEN}/>, <ActionLink {...this.data.actions.RAITON}/>, and <ActionLink {...this.data.actions.DOTON}/> under <ActionLink {...this.data.actions.KASSATSU}/>. For raw damage, <ActionLink {...this.data.actions.HYOSHO_RANRYU}/> and <ActionLink {...this.data.actions.GOKA_MEKKYAKU}/> should always be used in single-target and AoE situations respectively.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.generalbads.why">
					You cast standard damaging Ninjutsu <Plural value={generalBads} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this.kassatsuUses[this.data.actions.SUITON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SUITON.icon,
				content: <Trans id="nin.kassatsu.suggestions.suiton.content">
					Avoid using <ActionLink {...this.data.actions.SUITON}/> under <ActionLink {...this.data.actions.KASSATSU}/> unless using it to set up for a critically important <ActionLink {...this.data.actions.TRICK_ATTACK}/>. It's generally best to use it on <ActionLink {...this.data.actions.HYOSHO_RANRYU}/> while Trick Attack is up, as its cooldown should align it with every window.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.suiton.why">
					You cast Suiton <Plural value={this.kassatsuUses[this.data.actions.SUITON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this.kassatsuUses[this.data.actions.RABBIT_MEDIUM.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.RABBIT_MEDIUM.icon,
				content: <Trans id="nin.kassatsu.suggestions.rabbit.content">
					Be especially careful not to flub your mudras under <ActionLink {...this.data.actions.KASSATSU}/>, as <ActionLink {...this.data.actions.RABBIT_MEDIUM}/> does no damage and completely wastes the 30% potency buff Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.rabbit.why">
					You cast Rabbit Medium <Plural value={this.kassatsuUses[this.data.actions.RABBIT_MEDIUM.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}
	}
}
