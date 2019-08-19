import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from 'parser/jobs/ast/modules/DISPLAY_ORDER'
import React from 'react'
import {ARCANA_STATUSES, PLAY} from './ArcanaGroups'
import ArcanaTracking from './ArcanaTracking/ArcanaTracking'

// TODO THINGS TO TRACK:
// Track them using Draw when they still have a minor arcana (oopsie) or a card in the spread

const CARD_DURATION = 15000
const SLEEVE_DRAW_PLAYS_GIVEN = 3

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

	protected init() {
		this.addHook('cast', {abilityId: ACTIONS.DRAW.id, by: 'player'}, this.onDraw)
		this.addHook('cast', {abilityId: ACTIONS.SLEEVE_DRAW.id, by: 'player'}, this.onSleeveDraw)
		this.addHook('cast', {abilityId: PLAY, by: 'player'}, this.onPlay)

		this.addHook('applybuff', {abilityId: STATUSES.SLEEVE_DRAW.id, by: 'player'}, this.onSleeveBuff)
		this.addHook('applybuff', {abilityId: ARCANA_STATUSES, by: 'player'}, this.onPlayBuff)

		this.addHook('complete', this._onComplete)
	}

	private onDraw(event: CastEvent) {
		this.draws++

		if (this.draws === 1) {
			// The first use, take holding as from the start of the fight
			this.drawDrift = event.timestamp - this.parser.fight.start_time

		} else {
			// Take holding as from the time it comes off cooldown
			this.drawDrift = event.timestamp - this.lastDrawTimestamp - (ACTIONS.DRAW.cooldown * 1000)
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
		this.prepullPrepped = true
		this.plays++
	}

	private onSleeveDraw(event: CastEvent) {
		this.sleeveUses++

		if (this.sleeveUses === 1 && !this.prepullSleeve) {
			// The first use, take holding as from the start of the fight
			this.sleeveDrift = event.timestamp - this.parser.fight.start_time

		} else {
			// Take holding as from the time it comes off cooldown
			this.sleeveDrift = event.timestamp - this.lastSleeveTimestamp - (ACTIONS.SLEEVE_DRAW.cooldown * 1000)
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

	private _onComplete() {

		// If they stopped using Sleeve at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.fight.end_time - this.lastSleeveTimestamp > (ACTIONS.SLEEVE_DRAW.cooldown * 1000)) {
			this.sleeveTotalDrift += (this.parser.fight.end_time - (this.lastSleeveTimestamp + (ACTIONS.SLEEVE_DRAW.cooldown * 1000)))
		}

		// If they stopped using Draw at any point in the fight, this'll calculate the drift "accurately"
		if (this.parser.fight.end_time - this.lastDrawTimestamp > (ACTIONS.DRAW.cooldown * 1000)) {
			this.drawTotalDrift += (this.parser.fight.end_time - ((this.lastDrawTimestamp + ACTIONS.DRAW.cooldown * 1000)))
		}

		// Max plays:
		// [(fight time / 30s draw time + 1) - 1 if fight time doesn't end between xx:05-xx:29s, and xx:45-xx:60s]
		// eg 7:00: 14 -1 = 13  draws by default. 7:17 fight time would mean 14 draws, since they can play the last card at least.
		// in otherwords, fightDuration - 15s (for the buff @ CARD_DURATION)
		// SleeveDraw consideration:
		// fight time / 180s sleeve time + 1: each sleeve gives an extra 3 plays 7:00 = 9 extra plays.
		// Prepull consideration: + 1 play

		// Begin Theoretical Max Plays calc
		const fightDuration = this.parser.fight.end_time - this.parser.fight.start_time
		const maxSleeveUses = Math.floor((fightDuration - (CARD_DURATION*2)) / (ACTIONS.SLEEVE_DRAW.cooldown * 1000)) + 1
		const playsFromSleeveDraw = maxSleeveUses * SLEEVE_DRAW_PLAYS_GIVEN
		const playsFromDraw = Math.floor((fightDuration - CARD_DURATION) / (ACTIONS.DRAW.cooldown * 1000)) + 1
		const theoreticalMaxPlays = playsFromDraw + playsFromSleeveDraw + 1

		// TODO: Include downtime calculation for each fight??
		// TODO: Suggest how to redraw effectively (maybe in ArcanaSuggestions)

		// Confirm they had preprepped a card on pull
		const pullState = this.arcanaTracking.getPullState()
		if (pullState.drawState > 0) {
			this.prepullPrepped = true
		}

		const totalCardsObtained = (this.prepullPrepped ? 1 : 0) + this.draws + (this.sleeveUses * SLEEVE_DRAW_PLAYS_GIVEN)

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
				Playing cards will let you collect seals for <ActionLink {...ACTIONS.DIVINATION} /> and contribute to party damage.
			</Trans>
			<ul>
				<li><Trans id="ast.draw.checklist.description.prepull">Prepared before pull:</Trans>&nbsp;{this.prepullPrepped ? 1 : 0}/1</li>
				<li><Trans id="ast.draw.checklist.description.draws">Obtained from <ActionLink {...ACTIONS.DRAW} />:</Trans>&nbsp;{this.draws}/{playsFromDraw}</li>
				<li><Trans id="ast.draw.checklist.description.sleeve-draws">Obtained from <ActionLink {...ACTIONS.SLEEVE_DRAW} />:</Trans>&nbsp;{this.sleeveUses * SLEEVE_DRAW_PLAYS_GIVEN}/{playsFromSleeveDraw}</li>
				<li><Trans id="ast.draw.checklist.description.total">Total cards obtained:</Trans>&nbsp;{totalCardsObtained}/{theoreticalMaxPlays}</li>
			</ul></>,
			tiers: {[warnTarget]: TARGET.WARN, [failTarget]: TARGET.FAIL, [100]: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="ast.draw.checklist.requirement.name">
						<ActionLink {...ACTIONS.PLAY} /> uses
					</Trans>,
					value: this.plays,
					target: theoreticalMaxPlays,
				}),
			],
		}))

		/*
			SUGGESTION: Didn't use draw enough
		*/
		const drawsMissed = Math.floor(this.drawTotalDrift / (ACTIONS.DRAW.cooldown * 1000))
		if (this.draws > 0 && drawsMissed > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-uses.content">
						Use <ActionLink {...ACTIONS.DRAW} /> as soon as its available to maximize the number of cards played.
				</Trans>,
				tiers: SEVERITIES.DRAW_HOLDING,
				value: drawsMissed,
				why: <Trans id="ast.draw.suggestions.draw-uses.why">
					About <Plural value={drawsMissed} one=" # use" other="# uses" /> of <ActionLink {...ACTIONS.DRAW} /> were missed by holding it for at least a total of {this.parser.formatDuration(this.drawTotalDrift)}.
				</Trans>,
			}))
		}
		/*
			SUGGESTION: Didn't use draw at all
		*/
		if (this.draws === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-no-usage.content">
						No uses of <ActionLink {...ACTIONS.DRAW} /> at all.
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
		const sleevesMissed = Math.floor(this.sleeveTotalDrift / (ACTIONS.SLEEVE_DRAW.cooldown * 1000))
		if (this.sleeveUses > 0 && sleevesMissed > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SLEEVE_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.sleeve-uses.content">
						Use <ActionLink {...ACTIONS.SLEEVE_DRAW} /> more frequently. It should be paired with every other <ActionLink {...ACTIONS.DIVINATION} /> to stack buffs at the same time. <ActionLink {...ACTIONS.LIGHTSPEED} /> can be used to weave card abilities.
				</Trans>,
				tiers: SEVERITIES.SLEEVE_DRAW_HOLDING,
				value: sleevesMissed,
				why: <Trans id="ast.draw.suggestions.sleeve-uses.why">
					About <Plural value={sleevesMissed} one=" # use" other="# uses" /> of <ActionLink {...ACTIONS.SLEEVE_DRAW} /> were missed by holding it for at least a total of {this.parser.formatDuration(this.sleeveTotalDrift)}.
				</Trans>,
			}))
		}
		/*
			SUGGESTION: Didn't use sleeve draw at all
		*/
		if (this.sleeveUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SLEEVE_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.sleeve-no-usage.content">
						No uses of <ActionLink {...ACTIONS.SLEEVE_DRAW} /> at all.
						It should be paired with every other <ActionLink {...ACTIONS.DIVINATION} /> to stack buffs at the same time. <ActionLink {...ACTIONS.LIGHTSPEED} /> can be used to weave card abilities.
				</Trans>,
				why: <Trans id="ast.draw.suggestions.sleeve-no-usage.why">
					No sleeve draws used.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

	}
}
