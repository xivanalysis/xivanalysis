import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const DOTON_TICK_TARGET = 6
const JUSTIFIABLE_DOTON_TICKS = 10

interface DotonCast {
	tcj: boolean,
	ticks: number[],
	prepull: boolean,
}

export class Ninjutsu extends Analyser {
	static override handle = 'ninjutsu'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private hyotonCount: number = 0
	private rabbitCount: number = 0
	private current?: DotonCast
	private history: DotonCast[] = []

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf([this.data.actions.HYOTON.id, this.data.actions.HYOTON_TCJ.id])), () => { this.hyotonCount++ })
		this.addEventHook(playerFilter.type('action').action(this.data.actions.RABBIT_MEDIUM.id), () => { this.rabbitCount++ })
		this.addEventHook(playerFilter.type('action').action(oneOf([this.data.actions.DOTON.id, this.data.actions.DOTON_TCJ.id])), this.onDotonCast)
		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseStatus(['DOTON'])), event => { this.current?.ticks.push(event.targets.length || 0) })
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.DOTON.id), this.finishDotonWindow)
		this.addEventHook('complete', this.onComplete)
	}

	private onDotonCast(event: Events['action']) {
		this.finishDotonWindow()

		this.current = {
			tcj: this.actors.current.hasStatus(this.data.statuses.TEN_CHI_JIN.id),
			ticks: [],
			prepull: event.timestamp < this.parser.fight.start_time,
		}
	}

	private finishDotonWindow() {
		if (this.current == null) {
			return
		}

		this.history.push(this.current)
		this.current = undefined
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
			icon: this.data.actions.HYOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.hyoton.content">
				Avoid using <ActionLink action="HYOTON"/>, as it's the weakest of the mudra combinations and should typically never be used in raid content.
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
			icon: this.data.actions.RABBIT_MEDIUM.icon,
			content: <Trans id="nin.ninjutsu.suggestions.rabbit.content">
				Be careful not to flub your mudras, as using <ActionLink action="RABBIT_MEDIUM"/> can cost you personal DPS at best and raid DPS at worst by reducing the number of <ActionLink action="TRICK_ATTACK"/>s you can do during the fight.
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
			icon: this.data.actions.DOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.tcj-doton.content">
				Avoid using <ActionLink action="DOTON"/> under <ActionLink action="TEN_CHI_JIN"/> unless you're up against multiple targets. On a single target, using the <ActionLink action="SUITON"/> combo will do equivalent or better damage and keep it aligned with <ActionLink action="MEISUI"/>.
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
				icon: this.data.actions.DOTON.icon,
				content: <Trans id="nin.ninjutsu.suggestions.aoe-doton.content">
					<ActionLink action="DOTON"/> requires at least {DOTON_TICK_TARGET} ticks to be worthwhile in an AoE setting. Use <ActionLink action="KATON"/> instead against adds that will die quickly.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.ninjutsu.suggestions.aoe-doton.why">
					You cast an unoptimized Doton cast <Plural value={badAoes} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DOTON.icon,
			content: <Trans id="nin.ninjutsu.suggestions.st-doton.content">
				Avoid using <ActionLink action="DOTON"/> on single targets, as it does less damage than <ActionLink action="RAITON"/> if any ticks miss and uses more mudras, resulting in more GCD delay for no gain.
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
