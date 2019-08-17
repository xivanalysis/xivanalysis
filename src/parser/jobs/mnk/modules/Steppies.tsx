import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import {CastEvent, DamageEvent, HitType} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const LEAD_BOOT_POTENCY = 300

// Typically a player with lag can derp positional in opener, this usually happens 2 times per fight.
const CRIT_BOOT_SEVERITY = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

// 3 is pretty much "you ruined a Perfect Balance you turkey".
const WEAK_BOOT_SEVERITY = {
	1: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

class Boot {
	crit: boolean
	timestamp: number
	weak: boolean

	constructor(weak: boolean, timestamp: number) {
		this.crit = false
		this.weak = weak
		this.timestamp = timestamp
	}
}

export default class Steppies extends Module {
	static handle = 'steppies'

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions

	private currentBoot?: Boot
	private steppies: Boot[] = []

	protected init(): void {
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.BOOTSHINE.id}, this.onCast)
		this.addHook('damage', {by: 'player', abilityId: ACTIONS.BOOTSHINE.id}, this.onStep)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		this.currentBoot = new Boot(this.combatants.selected.hasStatus(STATUSES.LEADEN_FIST.id), event.timestamp)
	}

	private onStep(event: DamageEvent): void {
		if (this.currentBoot && this.currentBoot.timestamp === event.timestamp) {
			// TODO: This should use the HitType normaliser but it's not actually connected to DamageEvent properly
			this.currentBoot.crit = event.hitType === HitType.CRITICAL

			this.steppies.push(this.currentBoot)
		}
	}

	private onComplete(): void {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.steppies.checklist.name">Buff Bootshine</Trans>,
			description: <Trans id="mnk.steppies.checklist.description">
				<ActionLink {...ACTIONS.BOOTSHINE}/> is your strongest form GCD when you buff it by using <ActionLink {...ACTIONS.DRAGON_KICK} /> beforehand.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DRAGON_KICK,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.steppies.checklist.requirement.name"><StatusLink {...STATUSES.LEADEN_FIST}/> buff rate</Trans>,
					percent: () => this.getLeadenPercent(this.steppies),
				}),
			],
			target: 100,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DRAGON_KICK.icon,
			content: <Trans id="mnk.steppies.suggestions.dragon_kick.content">
				Avoid unbuffed <ActionLink {...ACTIONS.BOOTSHINE} /> by using <ActionLink {...ACTIONS.DRAGON_KICK} /> before it.
			</Trans>,
			why: <Trans id="mnk.steppies.suggestions.dragon_kick.why">
				{this.getUnbuffedCount(this.steppies) * (LEAD_BOOT_POTENCY - ACTIONS.BOOTSHINE.potency)} potency lost to missing <StatusLink {...STATUSES.LEADEN_FIST} /> buff {this.getUnbuffedCount(this.steppies)} times.
			</Trans>,
			tiers: WEAK_BOOT_SEVERITY,
			value: this.getUnbuffedCount(this.steppies),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BOOTSHINE.icon,
			content: <Trans id="mnk.steppies.suggestions.bootshine.content">
				Try to always hit your positional on <ActionLink {...ACTIONS.BOOTSHINE} />. Between the guaranteed critical hit under <StatusLink {...STATUSES.OPO_OPO_FORM} /> and the potency buff from <StatusLink {...STATUSES.LEADEN_FIST} />, this is essentially your strongest skill.
			</Trans>,
			why: <Trans id="mnk.steppies.suggestions.bootshine.why">
				<Plural value={this.getUncritCount(this.steppies)} one="# use of" other="# uses of" /> <ActionLink {...ACTIONS.BOOTSHINE} /> executed with incorrect position.
			</Trans>,
			tiers: CRIT_BOOT_SEVERITY,
			value: this.getUncritCount(this.steppies),
		}))
	}

	getUnbuffedCount(boots: Boot[]): number {
		return boots.reduce((total, current) => current.weak ? total+1 : total, 0)
	}

	getUncritCount(boots: Boot[]): number {
		return boots.reduce((total, current) => current.crit ? total+1 : total, 0)
	}

	getLeadenPercent(boots: Boot[]): number {
		return 100 - (this.getUnbuffedCount(boots) / boots.length) * 100
	}
}
