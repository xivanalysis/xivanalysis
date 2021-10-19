import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import Suggestions, {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const DOTON_TICK_TARGET = 6
const JUSTIFIABLE_DOTON_TICKS = 10

interface DotonCast {
	tcj: boolean,
	ticks: number[],
	prepull: boolean,
}

export default class Ninjutsu extends Module {
	static override handle = 'ninjutsu'

	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions

	private hyotonCount: number = 0
	private rabbitCount: number = 0
	private current: DotonCast | null = null
	private history: DotonCast[] = []

	protected override init() {
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.HYOTON.id, ACTIONS.HYOTON_TCJ.id]}, () => { this.hyotonCount++ })
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.RABBIT_MEDIUM.id}, () => { this.rabbitCount++ })
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.DOTON.id, ACTIONS.DOTON_TCJ.id]}, this.onDotonCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: STATUSES.DOTON.id}, event => { this.current?.ticks.push(event.hitCount || 0) })
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.DOTON.id}, this.finishDotonWindow)
		this.addEventHook('complete', this.onComplete)
	}

	private onDotonCast(event: CastEvent) {
		this.finishDotonWindow()

		this.current = {
			tcj: this.combatants.selected.hasStatus(STATUSES.TEN_CHI_JIN.id),
			ticks: [],
			prepull: event.timestamp < this.parser.fight.start_time,
		}
	}

	private finishDotonWindow() {
		if (!this.current) {
			return
		}

		this.history.push(this.current)
		this.current = null
	}

	private appraiseDotonCasts() {
		const result = {
			badTcjs: 0, // Single-target TCJ Dotons (do not do this)
			badAoes: 0, // AoE Dotons that fell short of 6 ticks (Katon will be more damage)
			badStds: 0, // Single-target regular Dotons (also do not do this)
		}

		this.history.forEach(cast => {
			if (cast.tcj && cast.ticks.every(tick => tick === 1)) {
				// If it's a fully single-target TCJ, flag it
				result.badTcjs++
			} else if (cast.ticks.every(tick => tick > 1)) {
				// If it's a fully multi-target Doton that misses at least 2 ticks, flag it
				if (cast.ticks.length < DOTON_TICK_TARGET) {
					result.badAoes++
				}
			} else if (!cast.prepull && cast.ticks.reduce((accum, value) => accum + value, 0) < JUSTIFIABLE_DOTON_TICKS) {
				// If it's a partial or entirely single-target and it doesn't reach the hit threshold for a good Doton, flag it
				// Note: Fully single-target Dotons will never reach this threshold
				result.badStds++
			}
		})

		return result
	}

	private onComplete() {
		this.finishDotonWindow()

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HYOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.hyoton.content">
				Avoid using <ActionLink {...ACTIONS.HYOTON}/>, as it's the weakest of the mudra combinations and should typically never be used in raid content.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR, // Probably a fat finger
				2: SEVERITY.MEDIUM, // Probably deliberate
			},
			value: this.hyotonCount,
			why: <Trans id="nin.ninjutsu.suggestions.hyoton.why">
				You cast Hyoton <Plural value={this.hyotonCount} one="# time" other="# times"/>.
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
			value: this.rabbitCount,
			why: <Trans id="nin.ninjutsu.suggestions.rabbit.why">
				You cast Rabbit Medium <Plural value={this.rabbitCount} one="# time" other="# times"/>.
			</Trans>,
		}))

		const {badTcjs, badAoes, badStds} = this.appraiseDotonCasts()
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.tcj-doton.content">
				Avoid using <ActionLink {...ACTIONS.DOTON}/> under <ActionLink {...ACTIONS.TEN_CHI_JIN}/> unless you're up against multiple targets. On a single target, using the <ActionLink {...ACTIONS.SUITON}/> combo will do equivalent or better damage and keep it aligned with <ActionLink {...ACTIONS.MEISUI}/>.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: badTcjs,
			why: <Trans id="nin.ninjutsu.suggestions.tcj-doton.why">
				You cast a single-target Doton under Ten Chi Jin <Plural value={badTcjs} one="# time" other="# times"/>.
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
				Avoid using <ActionLink {...ACTIONS.DOTON}/> on single targets, as it does less damage than <ActionLink {...ACTIONS.RAITON}/> if any ticks miss and uses more mudras, resulting in more GCD delay for no gain.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
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
