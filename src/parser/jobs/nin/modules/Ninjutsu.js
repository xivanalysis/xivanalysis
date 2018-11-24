import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const DOTON_TICK_TARGET = 6
const TCJ_DOTON_TICK_TARGET = 7
const JUSTIFIABLE_DOTON_TICKS = 10

export default class Ninjutsu extends Module {
	static handle = 'ninjutsu'
	static dependencies = [
		'combatants',
		'downtime',
		'suggestions',
	]

	_hyotonCount = 0
	_rabbitCount = 0
	_dotonCasts = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.HYOTON.id}, this._onHyotonCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.RABBIT_MEDIUM.id}, this._onRabbitCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.DOTON.id}, this._onDotonCast)
		this.addHook('aoedamage', {by: 'player', abilityId: STATUSES.DOTON.id}, this._onDotonDamage)
		this.addHook('complete', this._onComplete)
	}

	_onHyotonCast() {
		this._hyotonCount++
	}

	_onRabbitCast(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			// Don't penalize for Rabbits during downtime - if a boss jumps mid-mudra, it's the most efficient way to get it on CD
			this._rabbitCount++
		}
	}

	_onDotonCast(event) {
		this._dotonCasts.push({
			cast: event,
			tcj: this.combatants.selected.hasStatus(STATUSES.TEN_CHI_JIN.id), // STDs are only okay under TCJ
			ticks: [],
		})
	}

	_onDotonDamage(event) {
		// If there are no casts at all, use the damage event to fabricate one
		if (this._dotonCasts.length === 0) {
			this._onDotonCast(event)
		}

		this._dotonCasts[this._dotonCasts.length - 1].ticks.push(event.hits.length) // Track the number of enemies hit per tick
	}

	_appraiseDotonCasts() {
		const result = {
			badTcjs: 0, // TCJ Dotons that fell short of 7 ticks (TCJ Suiton will be more damage)
			badAoes: 0, // AoE Dotons that fell short of 6 ticks (Katon will be more damage)
			badStds: 0, // Single-target regular Dotons (do not do this)
		}

		this._dotonCasts.forEach(cast => {
			if (cast.tcj && cast.ticks.every(tick => tick === 1)) {
				// If it's a fully single-target TCJ that doesn't land every Doton tick, flag it
				if (cast.ticks.length < TCJ_DOTON_TICK_TARGET) {
					result.badTcjs++
				}
			} else if (cast.ticks.every(tick => tick > 1)) {
				// If it's a fully multi-target Doton that misses at least 2 ticks, flag it
				if (cast.ticks.length < DOTON_TICK_TARGET) {
					result.badAoes++
				}
			} else if (cast.ticks.reduce((accum, value) => accum + value, 0) < JUSTIFIABLE_DOTON_TICKS) {
				// If it's a partial or entirely single-target and it doesn't reach the hit threshold for a good Doton, flag it
				// Note: Fully single-target Dotons will never reach this threshold
				result.badStds++
			}
		})

		return result
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HYOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.hyoton.content">
				Avoid using <ActionLink {...ACTIONS.HYOTON}/>, as it's the weakest of the mudra combinations and should typically never be used in raid content.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR, // Probably a fat finger
				2: SEVERITY.MEDIUM, // Probably deliberate
			},
			value: this._hyotonCount,
			why: <Trans id="nin.ninjutsu.suggestions.hyoton.why">
				You cast Hyoton <Plural value={this._hyotonCount} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RABBIT_MEDIUM.icon,
			content: <Trans id="nin.ninjutsu.suggestions.rabbit.content">
				Be careful not to flub your mudras, as using <ActionLink {...ACTIONS.RABBIT_MEDIUM}/> can cost you personal DPS at best and raid DPS at worst by reducing the number of <ActionLink {...ACTIONS.TRICK_ATTACK}/>s you can do during the fight.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM, // You were having a bad day, mudra lag, etc.
				3: SEVERITY.MAJOR, // Holy shit get better internet
			},
			value: this._rabbitCount,
			why: <Trans id="nin.ninjutsu.suggestions.rabbit.why">
				You cast Rabbit Medium <Plural value={this._rabbitCount} one="# time" other="# times"/>.
			</Trans>,
		}))

		const {badTcjs, badAoes, badStds} = this._appraiseDotonCasts()
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.tcj-doton.content">
				Avoid using <ActionLink {...ACTIONS.DOTON}/> under <ActionLink {...ACTIONS.TEN_CHI_JIN}/> unless at least {TCJ_DOTON_TICK_TARGET} ticks will hit or you're up against multiple targets. On a single target that's about to jump or move, using the <ActionLink {...ACTIONS.SUITON}/> combo will do more damage even if <ActionLink {...ACTIONS.TRICK_ATTACK}/> is on cooldown.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: badTcjs,
			why: <Trans id="nin.ninjutsu.suggestions.tcj-doton.why">
				You cast an unoptimized Doton under Ten Chi Jin <Plural value={badTcjs} one="# time" other="# times"/>.
			</Trans>,
		}))

		if (badAoes > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DOTON.icon,
				content: <Trans id="nin.ninjutsu.suggestions.aoe-doton.content">
					<ActionLink {...ACTIONS.DOTON}/> requires at least {DOTON_TICK_TARGET} ticks to be worthwhile in an AoE setting. Use <ActionLink {...ACTIONS.KATON}/> instead against adds that will die quickly.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.ninjutsu.suggestions.aoe-doton.why">
					You cast an unoptimized Doton cast <Plural value={badAoes} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.st-doton.content">
				Avoid using <ActionLink {...ACTIONS.DOTON}/> on single targets outside of <ActionLink {...ACTIONS.TEN_CHI_JIN}/>, as it does less damage than <ActionLink {...ACTIONS.RAITON}/> if any ticks miss and uses more mudras, resulting in more GCD clipping for no gain.
			</Trans>,
			tiers: {
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: badStds,
			why: <Trans id="nin.ninjutsu.suggestions.st-doton.why">
				You cast a single-target Doton <Plural value={badStds} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
