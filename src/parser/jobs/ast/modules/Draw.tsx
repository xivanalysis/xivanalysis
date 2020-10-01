import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Data} from 'parser/core/modules/Data'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from 'parser/jobs/ast/modules/DISPLAY_ORDER'
import React from 'react'
import {ARCANA_STATUSES, PLAY, DRAWN_ARCANA} from './ArcanaGroups'
import ArcanaTracking from './ArcanaTracking/ArcanaTracking'
import GlobalCooldown from '../../../core/modules/GlobalCooldown'
import {Event} from '../../../../events'
import {Action} from '../../../../data/ACTIONS'

// TODO THINGS TO TRACK:
// Track them using Draw when they still have a minor arcana (oopsie) or a card in the spread

const SLEEVE_DRAW_PLAYS_GIVEN_500 = 3
const SLEEVE_DRAW_PLAYS_GIVEN_530 = 1

const WARN_TARGET_MAXPLAYS = 2
const FAIL_TARGET_MAXPLAYS = 3

const SEVERITIES = {
	DRAW_HOLDING: {
		1: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	SLEEVE_DRAW_HOLDING: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

export default class Draw extends Module {
	static handle = 'draw'
	static title = t('ast.draw.title')`Draw`

	@dependency private data!: Data
	@dependency private gcd!: GlobalCooldown
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private arcanaTracking!: ArcanaTracking

	private prepullDraw = false
	private prepullSleeve = false
	private prepullPlay = false

	// First draw we did after the pull
	private firstDrawTimestamp: number | null = null
	private lastDrawTimestamp = 0
	private drawDrift = 0
	private drawTotalDrift = 0

	// First sleeve draw we did after the pull
	private firstSleeveDrawTimestamp: number | null = null
	private lastSleeveTimestamp = 0
	private sleeveDrift = 0
	private sleeveTotalDrift = 0

	private draws = 0
	private plays = 0
	private sleeveUses = 0

	private cardsPerSleeveDraw = SLEEVE_DRAW_PLAYS_GIVEN_530

	private PLAY_CARD_CASTS: number[] = []
	private ARCANA_BUFF_STATUSES: number[] = []
	private DRAWN_ARCANA_STATUSES: number[] = []

	protected init() {
		this.PLAY_CARD_CASTS = PLAY.map(actionKey => this.data.actions[actionKey].id)
		this.ARCANA_BUFF_STATUSES = ARCANA_STATUSES.map(statusKey => this.data.statuses[statusKey].id)
		this.DRAWN_ARCANA_STATUSES = DRAWN_ARCANA.map(statusKey => this.data.statuses[statusKey].id)

		// Handles before the pull
		this.addEventHook('applybuff', {abilityId: this.ARCANA_BUFF_STATUSES, by: 'player'}, this.onPlayBuff)
		this.addEventHook('applybuff', {abilityId: this.DRAWN_ARCANA_STATUSES, by: 'player'}, this.onDrawBuff)
		this.addEventHook('applybuff', {abilityId: this.data.statuses.SLEEVE_DRAW.id, by: 'player'}, this.onSleeveBuff)

		// Handles after the pull
		this.addEventHook('cast', {abilityId: this.data.actions.DRAW.id, by: 'player'}, this.onDraw)
		this.addEventHook('cast', {abilityId: this.data.actions.SLEEVE_DRAW.id, by: 'player'}, this.onSleeveDraw)
		this.addEventHook('cast', {abilityId: this.PLAY_CARD_CASTS, by: 'player'}, this.onPlay)

		this.addEventHook('complete', this.onComplete)
		this.cardsPerSleeveDraw = this.parser.patch.before('5.3')
			? SLEEVE_DRAW_PLAYS_GIVEN_500
			: SLEEVE_DRAW_PLAYS_GIVEN_530
	}

	private isBeforeSleeveDrawRework() : boolean {
		return this.parser.patch.before('5.3')
	}

	// Just checks if a given event happened before the pull
	private isBeforePull(event: Event) : boolean {
		return event.timestamp < this.parser.fight.start_time
	}

	private playCard() {
		this.plays++
	}

	private drawCard() {
		this.draws++
	}

	private sleeveDrawCards() {
		this.sleeveUses++
	}

	private onPlayBuff(event: BuffEvent) {
		// Only handle before the pull
		if (this.isBeforePull(event)) {
			this.prepullPlay = true
			this.playCard()
		}
	}

	private onDrawBuff(event: BuffEvent) {
		// Only handle before the pull
		if (this.isBeforePull(event)) {
			this.prepullDraw = true
			this.lastDrawTimestamp = this.parser.fight.start_time
			this.drawCard()
		}
	}

	private onSleeveBuff(event: BuffEvent) {
		// Only handle before the pull
		if (this.isBeforePull(event)) {
			this.prepullSleeve = true
			this.lastSleeveTimestamp = this.parser.fight.start_time
			this.sleeveDrawCards()
		}
	}

	private onPlay(event: CastEvent) {
		if (!this.isBeforePull(event)) {
			this.playCard()
		}
	}

	private onDraw(event: CastEvent) {
		// ignore precasted draws
		if (!this.isBeforePull(event)) {
			if (this.firstDrawTimestamp === null) {
				this.firstDrawTimestamp = event.timestamp
			}
			this.drawCard()

			if (this.draws === 1) {
				// The first use, take holding as from the start of the fight
				this.drawDrift = event.timestamp - this.parser.fight.start_time

			} else {
				// Take holding as from the time it comes off cooldown
				this.drawDrift = event.timestamp - this.lastDrawTimestamp - (this.data.actions.DRAW.cooldown * 1000)
			}

			// Keep track of total drift time not using Draw
			if (this.drawDrift > 0) {
				this.drawTotalDrift += this.drawDrift
			}

			// update the last use
			this.lastDrawTimestamp = event.timestamp
		}
	}

	private onSleeveDraw(event: CastEvent) {
		if (!this.isBeforePull(event)) {
			if (this.firstSleeveDrawTimestamp === null) {
				this.firstSleeveDrawTimestamp = event.timestamp
			}
			this.sleeveDrawCards()

			if (this.sleeveUses === 1 && !this.prepullSleeve) {
				// The first use, take holding as from the start of the fight
				this.sleeveDrift = event.timestamp - this.parser.fight.start_time

			} else {
				// Take holding as from the time it comes off cooldown
				this.sleeveDrift = event.timestamp - this.lastSleeveTimestamp - (this.data.actions.SLEEVE_DRAW.cooldown * 1000)
			}

			// Keep track of total drift time not using sleeve
			if (this.sleeveDrift > 0) {
				this.sleeveTotalDrift += this.sleeveDrift
			}

			// update the last use
			this.lastSleeveTimestamp = event.timestamp
		}
	}

	/**
	 * Determine the largest possible number of cards we could sleeve draw during the fight, without doing weird things
	 * like using it pre-pull. If we did use it pre-pull, try to account for that, though. (We explicitly decline to
	 * handle accounting for if it's still on CD from a previous fight)
	 */
	private maxSleeveDrawCards() : number {
		const lowestPossibleCooldownMs = this.getLowestPossibleCooldownMs(this.prepullSleeve, this.data.actions.SLEEVE_DRAW, this.firstSleeveDrawTimestamp)
		const fightDurationMs = Math.max(0, this.parser.pull.duration - lowestPossibleCooldownMs)
		return this.maxCardsFromAbility(fightDurationMs, this.data.actions.SLEEVE_DRAW.cooldown * 1000, this.cardsPerSleeveDraw)
	}

	/**
	 * Determine the largest possible number of cards we could draw during the fight, accounting for it being used
	 * pre-pull.
	 */
	private maxDrawCards() : number {
		const lowestPossibleCooldownMs = this.getLowestPossibleCooldownMs(this.prepullDraw, this.data.actions.DRAW, this.firstDrawTimestamp)
		const fightDurationMs = Math.max(0, this.parser.pull.duration - lowestPossibleCooldownMs)
		return this.maxCardsFromAbility(fightDurationMs, this.data.actions.DRAW.cooldown * 1000, 1)
	}

	/**
	 * Determine the smallest possible remaining cooldown time remaining for the provided ability.
	 */
	private getLowestPossibleCooldownMs(usedPrePull: boolean, action: Action, firstDrawTimestamp: number | null) : number {
		// If we didn't use it pre-pull, then we can use it immediately
		let lowestPossibleCooldownMs = 0
		if (action.cooldown && usedPrePull) {
			// Worst case scenario, we activated it moments before the pull
			lowestPossibleCooldownMs = action.cooldown * 1000
			// If we saw a use after the pull, it should give us an estimate for when it was actually first used.
			if (firstDrawTimestamp !== null) {
				const timeBetweenStartAndFirstActivationMs = firstDrawTimestamp - this.parser.fight.start_time
				// Use the earlier of the two times.
				lowestPossibleCooldownMs = Math.min(lowestPossibleCooldownMs, timeBetweenStartAndFirstActivationMs)
			}
		}
		return lowestPossibleCooldownMs
	}

	private maxCardsFromAbility(durationMs: number, cooldownMs: number, cardsPerActivation: number) : number {
		const gcdMs = this.gcd.getEstimate(true)
		// See how many times the ability can come off of cooldown
		const timesCooledDown = Math.floor(durationMs / cooldownMs)

		// This is how much time is left over after all of our cooldowns. See if it's enough to squeeze in another one.
		// If we got 0 timesCooledDown in the last step, then we are checking if there was enough time for even a single full cast.
		const timeRemainingAfterLastCooldownMs = durationMs - (timesCooledDown * cooldownMs)

		// Convert to GCDs so we can use counts instead of working in ms.
		// The cast/animation time is lower than a GCD, but we also need time to pick targets
		const gcdsAfterLastCooldown = Math.floor(timeRemainingAfterLastCooldownMs / gcdMs)
		const maxPlaysFromFinalCooldown = Math.max(0, Math.min(gcdsAfterLastCooldown, cardsPerActivation))
		// Multiply the number of non-final casts with the plays per cast, and add how many we got in our final activation
		return (timesCooledDown * cardsPerActivation) + maxPlaysFromFinalCooldown
	}

	private onComplete() {
		// If they stopped using Sleeve at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.fight.end_time - this.lastSleeveTimestamp > (this.data.actions.SLEEVE_DRAW.cooldown * 1000)) {
			this.sleeveTotalDrift += (this.parser.fight.end_time - (this.lastSleeveTimestamp + (this.data.actions.SLEEVE_DRAW.cooldown * 1000)))
		}

		// If they stopped using Draw at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.fight.end_time - this.lastDrawTimestamp > (this.data.actions.DRAW.cooldown * 1000)) {
			this.drawTotalDrift += (this.parser.fight.end_time - ((this.lastDrawTimestamp + this.data.actions.DRAW.cooldown * 1000)))
		}

		// Theoretical Max Plays Calc
		// TODO: Include downtime calculation for each fight??
		const maxCardsFromDraw = this.maxDrawCards()
		const maxCardsFromSleeveDraw = this.maxSleeveDrawCards()

		// Pre-pull cards
		const cardsDrawnPrePull = this.prepullDraw ? 1 : 0
		const cardsSleeveDrawnPrePull = this.prepullSleeve ? this.cardsPerSleeveDraw : 0
		// Post-pull cards. Use the counters and subtract pre-pulls.
		const expectedCardsDrawPostPull = this.draws - cardsDrawnPrePull
		const expectedCardsSleeveDrawnPostPull = this.sleeveUses * this.cardsPerSleeveDraw - cardsSleeveDrawnPrePull
		// We didn't do any fancy GCD calculations on these, so cap them at our actual calculated maximum, just in case
		const cardsDrawnPostPull = Math.min(maxCardsFromDraw, expectedCardsDrawPostPull)
		const cardsSleeveDrawnPostPull = Math.min(maxCardsFromSleeveDraw, expectedCardsSleeveDrawnPostPull)

		// Number of cards actually drawn
		const totalCardsDrawn = cardsDrawnPrePull + cardsDrawnPostPull + cardsSleeveDrawnPrePull + cardsSleeveDrawnPostPull

		// Expect Draw pre-pull starting in 5.3
		const expectedCardsPrePull = this.isBeforeSleeveDrawRework() ? 0 : 1
		// If they pre-pulled more cards than we were going to request, avoid displaying something like 1/0 or 4/1
		const maxCardsPrePull = Math.max(expectedCardsPrePull, cardsDrawnPrePull + cardsSleeveDrawnPrePull)

		// Pre-Pull + Draw + Sleeve Draw
		const theoreticalMaxCards = maxCardsPrePull + maxCardsFromDraw + maxCardsFromSleeveDraw
		// Really, we can't play more than we actually drew, but it's sort of disingenuous to let them off the hook if they suck at using draw.
		// TODO: Maybe separate draw and play suggestions?
		const theoreticalMaxPlays = theoreticalMaxCards

		// TODO: Suggest how to redraw effectively (maybe in ArcanaSuggestions)

		/*
			CHECKLIST: Number of cards played
		*/
		const warnTarget = Math.floor(((theoreticalMaxPlays - WARN_TARGET_MAXPLAYS) / theoreticalMaxPlays) * 100)
		const failTarget = Math.floor(((theoreticalMaxPlays - FAIL_TARGET_MAXPLAYS) / theoreticalMaxPlays) * 100)
		this.checklist.add(new TieredRule({
			displayOrder: DISPLAY_ORDER.DRAW_CHECKLIST,
			name: <Trans id="ast.draw.checklist.name">
				Play as many cards as possible
			</Trans>,
			description: <><Trans id="ast.draw.checklist.description">
				Playing cards will let you collect seals for <ActionLink {...this.data.actions.DIVINATION} /> and contribute to party damage.
			</Trans>
			<ul>
				<li><Trans id="ast.draw.checklist.description.prepull">Prepared before pull:</Trans>&nbsp;{cardsDrawnPrePull + cardsSleeveDrawnPrePull}/{maxCardsPrePull}</li>
				<li><Trans id="ast.draw.checklist.description.draws">Obtained from <ActionLink {...this.data.actions.DRAW} />:</Trans>&nbsp;{cardsDrawnPostPull}/{maxCardsFromDraw}</li>
				<li><Trans id="ast.draw.checklist.description.sleeve-draws">Obtained from <ActionLink {...this.data.actions.SLEEVE_DRAW} />:</Trans>&nbsp;{cardsSleeveDrawnPostPull}/{maxCardsFromSleeveDraw}</li>
				<li><Trans id="ast.draw.checklist.description.total">Total cards obtained:</Trans>&nbsp;{totalCardsDrawn}/{theoreticalMaxCards}</li>
			</ul></>,
			tiers: {[warnTarget]: TARGET.WARN, [failTarget]: TARGET.FAIL, [100]: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="ast.draw.checklist.requirement.name">
						<ActionLink {...this.data.actions.PLAY} /> uses
					</Trans>,
					value: this.plays,
					target: theoreticalMaxPlays,
				}),
			],
		}))

		/*
			SUGGESTION: Didn't use draw enough
		*/
		const drawsMissed = Math.floor(this.drawTotalDrift / (this.data.actions.DRAW.cooldown * 1000))
		if (this.draws > 0 && drawsMissed > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-uses.content">
						Use <ActionLink {...this.data.actions.DRAW} /> as soon as its available to maximize both MP regen and the number of cards played.
				</Trans>,
				tiers: SEVERITIES.DRAW_HOLDING,
				value: drawsMissed,
				why: <Trans id="ast.draw.suggestions.draw-uses.why">
					About <Plural value={drawsMissed} one=" # use" other="# uses" /> of <ActionLink {...this.data.actions.DRAW} /> were missed by holding it for at least a total of {this.parser.formatDuration(this.drawTotalDrift)}.
				</Trans>,
			}))
		}
		/*
			SUGGESTION: Didn't use draw at all
		*/
		if (this.draws === 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-no-usage.content">
						No uses of <ActionLink {...this.data.actions.DRAW} /> at all.
				</Trans>,
				why: <Trans id="ast.draw.suggestions.draw-no-usage.why">
					No draws used.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		/*
			SUGGESTION: Didn't use sleeve draw enough
		*/
		const sleevesMissed = Math.floor(this.sleeveTotalDrift / (this.data.actions.SLEEVE_DRAW.cooldown * 1000))
		if (this.sleeveUses > 0 && sleevesMissed > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.SLEEVE_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.sleeve-uses.content">
						Use <ActionLink {...this.data.actions.SLEEVE_DRAW} /> more frequently. It should be paired with every other <ActionLink {...this.data.actions.DIVINATION} /> to stack buffs at the same time. <ActionLink {...this.data.actions.LIGHTSPEED} /> can be used to weave card abilities.
				</Trans>,
				tiers: SEVERITIES.SLEEVE_DRAW_HOLDING,
				value: sleevesMissed,
				why: <Trans id="ast.draw.suggestions.sleeve-uses.why">
					About <Plural value={sleevesMissed} one=" # use" other="# uses" /> of <ActionLink {...this.data.actions.SLEEVE_DRAW} /> were missed by holding it for at least a total of {this.parser.formatDuration(this.sleeveTotalDrift)}.
				</Trans>,
			}))
		}
		/*
			SUGGESTION: Didn't use sleeve draw at all
		*/
		if (this.sleeveUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SLEEVE_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.sleeve-no-usage.content">
						No uses of <ActionLink {...this.data.actions.SLEEVE_DRAW} /> at all.
						It should be paired with every other <ActionLink {...this.data.actions.DIVINATION} /> to stack buffs at the same time. <ActionLink {...this.data.actions.LIGHTSPEED} /> can be used to weave card abilities.
				</Trans>,
				why: <Trans id="ast.draw.suggestions.sleeve-no-usage.why">
					No sleeve draws used.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

	}
}
