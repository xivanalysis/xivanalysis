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
import {ARCANA_STATUSES, PLAY} from './ArcanaGroups'
import ArcanaTracking from './ArcanaTracking/ArcanaTracking'
import GlobalCooldown from '../../../core/modules/GlobalCooldown'
import {Action} from '../../../../data/ACTIONS'

// TODO THINGS TO TRACK:
// Track them using Draw when they still have a minor arcana (oopsie) or a card in the spread

const PREPULL_TIMER = 15000
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

function maxCardsFromAbility(fightDurationMs: number, gcdMs: number, cooldownMs: number, cardsToPlay: number) : number {
	// See how many times the ability can come off of cooldown
	const timesCooledDown = Math.floor(fightDurationMs / cooldownMs)

	// This is how much time is left over after all of our cooldowns. See if it's enough to squeeze in another one.
	// If we got 0 timesCooledDown in the last step, then we are checking if there was enough time for even a single full cast.
	const timeRemainingAfterLastCooldownMs = fightDurationMs - (timesCooledDown * cooldownMs)

	// Convert to GCDs so we can use counts instead of working in ms.
	// I think the cast/animation time may actually be lower than a GCD, but we also need time to pick targets
	const gcdsAfterLastCooldown = Math.floor(timeRemainingAfterLastCooldownMs / gcdMs)
	// We also have to spend a GCD on actually activating the ability, so subtract a gcd from gcdsAfterLastCooldown
	const maxPlaysFromFinalCooldown = Math.max(0, Math.min(gcdsAfterLastCooldown - 1, cardsToPlay))
	// Multiply the number of non-final casts with the plays per cast, and add how many we got in our final activation
	return (timesCooledDown * cardsToPlay) + maxPlaysFromFinalCooldown
}

export default class Draw extends Module {
	static handle = 'draw'
	static title = t('ast.draw.title')`Draw`

	@dependency private data!: Data
	@dependency private gcd!: GlobalCooldown
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private arcanaTracking!: ArcanaTracking

	private lastDrawTimestamp = 0
	private draws = 0
	private drawDrift = 0
	private drawTotalDrift = 0

	private plays = 0
	private prepullPrepped = false

	private lastSleeveTimestamp = 0
	private sleeveUses = 0
	private sleeveDrift = 0
	private sleeveTotalDrift = 0

	private prepullSleeve = false

	private PLAY: number[] = []
	private ARCANA_STATUSES: number[] = []


	protected init() {

		PLAY.forEach(actionKey => {
			this.PLAY.push(this.data.actions[actionKey].id)
		})

		ARCANA_STATUSES.forEach(statusKey => {
			this.ARCANA_STATUSES.push(this.data.statuses[statusKey].id)
		})

		this.addEventHook('cast', {abilityId: this.data.actions.DRAW.id, by: 'player'}, this.onDraw)
		this.addEventHook('cast', {abilityId: this.data.actions.SLEEVE_DRAW.id, by: 'player'}, this.onSleeveDraw)
		this.addEventHook('cast', {abilityId: this.PLAY, by: 'player'}, this.onPlay)

		this.addEventHook('applybuff', {abilityId: this.data.statuses.SLEEVE_DRAW.id, by: 'player'}, this.onSleeveBuff)
		this.addEventHook('applybuff', {abilityId: this.ARCANA_STATUSES, by: 'player'}, this.onPlayBuff)

		this.addEventHook('complete', this.onComplete)
	}

	private onDraw(event: CastEvent) {

		// ignore precasted draws
		if (event.timestamp < this.parser.fight.start_time) {
			return
		}

		this.draws++

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

	private onPlay() {
		this.plays++
	}

	private onPlayBuff(event: BuffEvent) {
		if (event.timestamp > this.parser.fight.start_time) {
			return
		}
		if (this.draws === 0 && this.sleeveUses === 0) {
			this.prepullPrepped = true
		}
		this.plays++
	}

	private onSleeveDraw(event: CastEvent) {
		this.sleeveUses++

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

	private onSleeveBuff(event: BuffEvent) {
		if (event.timestamp > this.parser.fight.start_time) {
			return
		}
		this.prepullSleeve = true
		this.sleeveUses++
		this.lastSleeveTimestamp = this.parser.fight.start_time
	}

	private onComplete() {
		const BEFORE_5_3_REWORK = this.parser.patch.before('5.3')
		const SLEEVE_DRAW_PLAYS_GIVEN = BEFORE_5_3_REWORK
			? SLEEVE_DRAW_PLAYS_GIVEN_500
			: SLEEVE_DRAW_PLAYS_GIVEN_530

		// If they stopped using Sleeve at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.fight.end_time - this.lastSleeveTimestamp > (this.data.actions.SLEEVE_DRAW.cooldown * 1000)) {
			this.sleeveTotalDrift += (this.parser.fight.end_time - (this.lastSleeveTimestamp + (this.data.actions.SLEEVE_DRAW.cooldown * 1000)))
		}

		// If they stopped using Draw at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.fight.end_time - this.lastDrawTimestamp > (this.data.actions.DRAW.cooldown * 1000)) {
			this.drawTotalDrift += (this.parser.fight.end_time - ((this.lastDrawTimestamp + this.data.actions.DRAW.cooldown * 1000)))
		}

		// Max plays:
		// [(fight time / 30s draw time + 1) - 1 if fight time doesn't end between xx:05-xx:29s, and xx:45-xx:60s]
		// eg 7:00: 14 -1 = 13  draws by default. 7:17 fight time would mean 14 draws, since they can play the last card at least.
		// in otherwords, fightDuration - 15s (for the buff @ CARD_DURATION)
		// SleeveDraw consideration:
		// fight time / 180s sleeve time + 1: each sleeve gives an extra 3 plays 7:00 = 9 extra plays.
		// Prepull consideration: + 1 play

		// Begin Theoretical Max Plays calc
		const fightDurationMs = this.parser.pull.duration
		const gcdMs = this.gcd.getEstimate(true)
		const maxPlaysFromSleeveDraw = maxCardsFromAbility(fightDurationMs, gcdMs, this.data.actions.SLEEVE_DRAW.cooldown * 1000, SLEEVE_DRAW_PLAYS_GIVEN)
		// Starting in 5.3, we expect a pre-pull draw at ~15s. This means it won't come off of cooldown until 15s into the fight.
		// If there wasn't a prepull draw, then we should also expect them to draw imemdiately.
		const expectedStartCooldownMs = BEFORE_5_3_REWORK || !this.prepullPrepped ? 0 : PREPULL_TIMER
		const maxPlaysFromDraw = maxCardsFromAbility(Math.max(0, fightDurationMs - expectedStartCooldownMs), gcdMs, this.data.actions.DRAW.cooldown * 1000, 1)
		// Expect a pre-pull starting in 5.3, or if we actually saw one pre-5.3
		const expectedPrePull = BEFORE_5_3_REWORK ? 0 : 1
		// Pre-Pull + Draw + Sleeve Draw
		const theoreticalMaxPlays = expectedPrePull + maxPlaysFromDraw + maxPlaysFromSleeveDraw

		// TODO: Include downtime calculation for each fight??
		// TODO: Suggest how to redraw effectively (maybe in ArcanaSuggestions)

		const totalCardsObtained = (this.prepullPrepped ? 1 : 0) + this.draws + (this.sleeveUses * SLEEVE_DRAW_PLAYS_GIVEN)

		/*
			CHECKLIST: Number of cards played
		*/
		const warnTarget = Math.floor(((theoreticalMaxPlays - WARN_TARGET_MAXPLAYS) / theoreticalMaxPlays) * 100)
		const failTarget = Math.floor(((theoreticalMaxPlays - FAIL_TARGET_MAXPLAYS) / theoreticalMaxPlays) * 100)
		const prepullChecklistDisplay = expectedPrePull === 0
			? ''
			: <><li><Trans id="ast.draw.checklist.description.prepull">Prepared before pull:</Trans>&nbsp;{this.prepullPrepped ? 1 : 0}/1</li></>

		this.checklist.add(new TieredRule({
			displayOrder: DISPLAY_ORDER.DRAW_CHECKLIST,
			name: <Trans id="ast.draw.checklist.name">
				Play as many cards as possible
			</Trans>,
			description: <><Trans id="ast.draw.checklist.description">
				Playing cards will let you collect seals for <ActionLink {...this.data.actions.DIVINATION} /> and contribute to party damage.
			</Trans>
			<ul>
				{prepullChecklistDisplay}
				<li><Trans id="ast.draw.checklist.description.draws">Obtained from <ActionLink {...this.data.actions.DRAW} />:</Trans>&nbsp;{this.draws}/{maxPlaysFromDraw}</li>
				<li><Trans id="ast.draw.checklist.description.sleeve-draws">Obtained from <ActionLink {...this.data.actions.SLEEVE_DRAW} />:</Trans>&nbsp;{this.sleeveUses * SLEEVE_DRAW_PLAYS_GIVEN}/{maxPlaysFromSleeveDraw}</li>
				<li><Trans id="ast.draw.checklist.description.total">Total cards obtained:</Trans>&nbsp;{totalCardsObtained}/{theoreticalMaxPlays}</li>
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
		} else {
			/*
				SUGGESTION: Didn't use draw enough
			*/
			const drawsMissed = Math.floor(this.drawTotalDrift / (this.data.actions.DRAW.cooldown * 1000))
			if (drawsMissed > 0) {
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
	 			SUGGESTION: Pre-pull draw
	 		*/
			if (!BEFORE_5_3_REWORK && !this.prepullPrepped) {
				this.suggestions.add(new Suggestion({
					icon: this.data.actions.DRAW.icon,
					content: <Trans id="ast.draw.suggestions.draw-no-prepull.content">
							Use <ActionLink {...this.data.actions.DRAW} /> before the pull to align <ActionLink {...this.data.actions.DIVINATION} /> with other raid buffs.
					</Trans>,
					why: <Trans id="ast.draw.suggestions.draw-no-prepull.why">
						No <ActionLink {...this.data.actions.DRAW} /> use was detected before the pull.
					</Trans>,
					severity: SEVERITY.MAJOR,
				}))
			}
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
		} else {
			/*
				SUGGESTION: Didn't use sleeve draw enough
			*/
			const sleevesMissed = Math.floor(this.sleeveTotalDrift / (this.data.actions.SLEEVE_DRAW.cooldown * 1000))
			if (sleevesMissed > 0) {
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
		}

	}
}
