import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Cause, Event, Events, SourceModifier} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const LEAD_BOOT_POTENCY = 370

// Typically a player with lag can derp positional in opener, this usually happens 2 times per fight.
// With 3 charges of RoE for a 6s no positionals buff, and True North every 45s tho, this shouldn't be
// an issue even if the player is lagging worse than the author of this comment.
const CRIT_BOOT_SEVERITY = {
	1: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const CRIT_MODIFIERS = new Set([SourceModifier.CRITICAL, SourceModifier.CRITICAL_DIRECT])

// 3 is pretty much "you ruined a Perfect Balance you turkey".
const WEAK_BOOT_SEVERITY = {
	1: SEVERITY.MEDIUM,
	4: SEVERITY.MAJOR,
}

// Essentially allow us to work on a single target
type EventDamageTarget = Events['damage']['targets'] extends Array<infer T> ? T : never

interface Boot {
	crit: boolean
	opo: boolean
	weak: boolean
	timestamp: number
}

export class Steppies extends Analyser {
	static override handle = 'steppies'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private steppies: Boot[] = []

	override initialise(): void {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('damage')
				.cause(filter<Cause>().action(this.data.actions.BOOTSHINE.id)),
			this.onStep,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onStep(event: Events['damage']): void {
		const boot: Boot = {
			crit: event.targets.some(this.isCriticalHit),
			opo: this.actors.current.hasStatus(this.data.statuses.OPO_OPO_FORM.id),
			weak: !this.actors.current.hasStatus(this.data.statuses.LEADEN_FIST.id),
			timestamp: event.timestamp,
		}

		this.steppies.push(boot)
	}

	private onComplete(): void {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.steppies.checklist.name">Buff Bootshine</Trans>,
			description: <Trans id="mnk.steppies.checklist.description">
				<DataLink action="BOOTSHINE"/> is your strongest form GCD when you buff it by using <DataLink action="DRAGON_KICK" /> beforehand.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DRAGON_KICK,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.steppies.checklist.requirement.name"><DataLink status="LEADEN_FIST"/> buff rate</Trans>,
					percent: () => this.getLeadenPercent(this.steppies),
				}),
			],
			target: 100,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DRAGON_KICK.icon,
			content: <Trans id="mnk.steppies.suggestions.dragon_kick.content">
				Avoid unbuffed <DataLink action="BOOTSHINE"/> by using <DataLink action="DRAGON_KICK" /> before it.
			</Trans>,
			why: <Trans id="mnk.steppies.suggestions.dragon_kick.why">
				{this.getUnbuffedCount(this.steppies) * (LEAD_BOOT_POTENCY - this.data.actions.BOOTSHINE.potency)} potency lost to missing <DataLink status="LEADEN_FIST"/> buff {this.getUnbuffedCount(this.steppies)} times.
			</Trans>,
			tiers: WEAK_BOOT_SEVERITY,
			value: this.getUnbuffedCount(this.steppies),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BOOTSHINE.icon,
			content: <Trans id="mnk.steppies.suggestions.bootshine.content">
				Try to always hit your positional on <DataLink action="BOOTSHINE"/>. Between the guaranteed critical hit under <DataLink status="OPO_OPO_FORM"/> and the potency buff from <DataLink status="LEADEN_FIST"/>, this is essentially your strongest skill.
			</Trans>,
			why: <Trans id="mnk.steppies.suggestions.bootshine.why">
				<Plural value={this.getUncritCount(this.steppies)} one="# use of" other="# uses of" /> <DataLink action="BOOTSHINE"/> executed with incorrect position.
			</Trans>,
			tiers: CRIT_BOOT_SEVERITY,
			value: this.getUncritCount(this.steppies),
		}))
	}

	getUnbuffedCount = (boots: Boot[]): number => boots.filter(boot => boot.weak).length

	getUncritCount = (boots: Boot[]): number => boots.filter(boot => !boot.crit && boot.opo).length

	getLeadenPercent = (boots: Boot[]): number => 100 - (this.getUnbuffedCount(boots) / boots.length) * 100

	private isCriticalHit({sourceModifier}: EventDamageTarget): boolean {
		return CRIT_MODIFIERS.has(sourceModifier)
	}
}
