import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
// import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
// import STATUSES from 'data/STATUSES'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Cooldowns from 'parser/jobs/mch/modules/Cooldowns'
import React from 'react'
import {PLAY} from './ArcanaGroups'

// THINGS TO TRACK:
// Whether they used draw prepull (check how soon they played and then drew again)
// perhaps go for displaying 11 out of 10 plays used, since prepull draw can be optional?
// Track them using Draw when they still have a minor arcana (oopsie) or a card in the spread

const CARD_DURATION = 15000
const SLEEVE_DRAW_PLAYS_GIVEN = 3
const SLEEVE_DRAW_CD_REDUCTION = 27
const DRAW_CD_REFUND_PER_SLEEVE_PLAY = 3000
const DRAW_CD_REFUND_PER_REDRAW_DURING_SLEEVE = 3000

const WARN_TARGET_MAX_PLAYS = 2
const FAIL_TARGET_MAX_PLAYS = 3

const SEVERITIES = {
	CARD_HOLDING: {
		15000: SEVERITY.MINOR,
		45000: SEVERITY.MEDIUM,
		60000: SEVERITY.MAJOR,
	},
	SLEEVE_DRAW_OVERWRITE: {
		15000: SEVERITY.MINOR,
		45000: SEVERITY.MEDIUM,
		60000: SEVERITY.MAJOR,
	},
}

export default class Draw extends Module {
	static handle = 'draw'
	static title = t('ast.draw.title')`Draw`

	@dependency private cooldowns!: Cooldowns
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	_lastDrawTimestamp = 0
	_draws = 0
	_drawDrift = 0
	_drawTotalDrift = 0

	_plays = 0

// tslint:disable-next-line: no-magic-numbers
	_sleeveResets: 0 | 1 | 2 | 3 = 0
	_sleeveUses = 0
	_sleeveOverwriteTime = 0

	protected init() {
		this.addHook('cast', {abilityId: ACTIONS.DRAW.id, by: 'player'}, this._onDraw)
		this.addHook('cast', {abilityId: ACTIONS.SLEEVE_DRAW.id, by: 'player'}, this._onSleeveDraw)
		this.addHook('cast', {abilityId: [...PLAY], by: 'player'}, this._onPlay)
		this.addHook('complete', this._onComplete)
	}

	private _onDraw(event: CastEvent) {
		this._draws++

		if (this._draws === 1) {
			// The first use, take holding as from the start of the fight
			this._drawDrift = event.timestamp - this.parser.fight.start_time

			console.log(this.parser.formatDuration(this._drawDrift))
		} else if (this._sleeveResets > 0) {
			this._sleeveResets--
			this.cooldowns.reduceCooldown(ACTIONS.DRAW.id, SLEEVE_DRAW_CD_REDUCTION)
			// Take holding as from the time it comes off cooldown, but it was a 3s cd
			this._drawDrift = event.timestamp - this._lastDrawTimestamp - ((ACTIONS.DRAW.cooldown - SLEEVE_DRAW_CD_REDUCTION) * 1000)
			console.log(this.parser.formatDuration(this._drawDrift))

		} else {
			// Take holding as from the time it comes off cooldown
			this._drawDrift = event.timestamp - this._lastDrawTimestamp - (ACTIONS.DRAW.cooldown * 1000)
			console.log(this.parser.formatDuration(this._drawDrift))
		}

		// Keep track of total drift time not using Draw
		if (this._drawDrift > 0) {
			this._drawTotalDrift += this._drawDrift
		}

		// update the last use
		this._lastDrawTimestamp = event.timestamp
	}

	private _onPlay() {
		this._plays++
	}

	private _onSleeveDraw(event: CastEvent) {
		this.cooldowns.resetCooldown(ACTIONS.DRAW.id)
		this._sleeveResets = SLEEVE_DRAW_PLAYS_GIVEN
		this._sleeveUses++

		this._sleeveOverwriteTime += (event.timestamp - this._lastDrawTimestamp)

	}

	private _onComplete() {
		console.log(this._plays)
		// Max plays:
		// [(fight time / 30s draw time) - 1 if fight time doesn't end between xx:05-xx:29s, and xx:45-xx:60s]
		// eg 7:00: 14 -1 = 13  draws by default. 7:17 fight time would mean 14 draws, since they can play the last card at least.
		// in otherwords, fightDuration - 15s (for the buff @ CARD_DURATION)
		// SleeveDraw consideration:
		// fight time / 180s sleeve time: each sleeve gives an extra 3 plays (unless they clip Draw CD) 7:00 = 6 extra plays.
		// consider time taken to actually play 3 times would be about 3 GCds (7s?) and consider 15s for the buff @ CARD_DURATION
		// Prepull consideration: + 1 play

		// Begin Theoretical Max Plays calc
		const fightDuration = this.parser.fight.end_time - this.parser.fight.start_time
		const sleeveCounts = Math.floor((fightDuration - CARD_DURATION) / (ACTIONS.SLEEVE_DRAW.cooldown * 1000)) + 1
		const playsFromSleeveDraw = sleeveCounts * SLEEVE_DRAW_PLAYS_GIVEN
		console.log(playsFromSleeveDraw)

		const playsFromDraw = Math.floor((fightDuration - CARD_DURATION - (sleeveCounts * DRAW_CD_REFUND_PER_SLEEVE_PLAY)) / (ACTIONS.DRAW.cooldown * 1000))

		const theoreticalMaxPlays = playsFromDraw + playsFromSleeveDraw
		console.log(theoreticalMaxPlays)
		// TODO: Need to account for resetting draw CD everytime sleeve plays
		// TODO: Include downtime calculation for each fight??
		// TODO: Calcultae more accurately based on Redraw uses
		// TODO: Suggest how to redraw effectively (maybe in ArcanaSuggestions)

		/*
			CHECKLIST: Number of cards played
		*/
		const warnTarget = (theoreticalMaxPlays - WARN_TARGET_MAX_PLAYS / theoreticalMaxPlays) * 100
		const failTarget = (theoreticalMaxPlays - FAIL_TARGET_MAX_PLAYS / theoreticalMaxPlays) * 100
		this.checklist.add(new TieredRule({
			name: <Trans id="ast.draw.checklist.name">
				Play as many cards as possible
			</Trans>,
			description: <Trans id="ast.draw.checklist.description">
				Playing cards will let you collect seals for <ActionLink {...ACTIONS.DIVINATION} /> and raise the party damage. <br/>
				* The maximum here accounts for <ActionLink {...ACTIONS.SLEEVE_DRAW} /> and assumes a card was prepared pre-pull.
			</Trans>,
			tiers: {[warnTarget]: TARGET.WARN, [failTarget]: TARGET.FAIL, [100]: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="ast.draw.checklist.requirement.name">
						<ActionLink {...ACTIONS.PLAY} /> uses
					</Trans>,
					value: this._plays,
					target: theoreticalMaxPlays,
				}),
			],
		}))

		/*
			SUGGESTION: Didn't use sleeve draw at all
		*/
		if (this._sleeveUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SLEEVE_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.sleeve-no-usage.content">
						No uses of <ActionLink {...ACTIONS.SLEEVE_DRAW} /> at all. It should be used right after <ActionLink {...ACTIONS.DRAW} /> to reset the cooldown, and paired with <ActionLink {...ACTIONS.DIVINATION} /> to stack card buffs at the same time.
				</Trans>,
				why: <Trans id="ast.draw.suggestions.sleeve-no-usage.why">
					No sleeve draws used.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

	}
}
