import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from 'parser/jobs/ast/modules/DISPLAY_ORDER'
import React from 'react'
import {PLAY_I, OFFENSIVE_ARCANA_STATUS} from './ArcanaGroups'

const oGCD_ALLOWANCE = 7500 //used in case the last draw comes up in the last second of the fight. Since plays are typically done in a separate weave, a full GCD would be needed to play the card. Takes another second to cast PLAY and therefore an AST would not DRAW if they couldn't even PLAY. Additionally, an AST would not play if not even a GCD could be cast before the end of the fight. Therefore, the oGCD_ALLOWANCE should be approcimately 3 GCDs (2 for AST to cast, 1 for job to do an action) = 3 * 2500
const INTENTIONAL_DRIFT_FOR_BURST = 7500 //gcds until draw is used in opener

const WARN_TARGET_MAXPLAYS = 1
const FAIL_TARGET_MAXPLAYS = 2

const SEVERITIES = {
	DRAW_HOLDING: { //harsh thresholds were chosen since a drift will invariably mess up burst alignment
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

export default class Draw extends Analyser {
	static override handle = 'draw'
	static override title = t('ast.draw.title')`Draw`

	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private draws: number = 0
	private cooldownEndTime: number = this.parser.pull.timestamp
	private drawTotalDrift: number = 0
	private playIs: number = 0
	private playLord: number = 0
	private playLady: number = 0

	private prepullPrepped: boolean = true //always true

	private playDamageActions: Array<Action['id']> = []
	private arcanaDamageStatuses: Array<Status['id']> = []

	override initialise() {

		this.playDamageActions = PLAY_I.map(actionKey => this.data.actions[actionKey].id)
		this.arcanaDamageStatuses = OFFENSIVE_ARCANA_STATUS.map(statusKey => this.data.statuses[statusKey].id)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.ASTRAL_DRAW.id)
		, this.onDraw)
		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.UMBRAL_DRAW.id)
		, this.onDraw)
		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(this.playDamageActions))
		, this.onPlayI)
		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.LORD_OF_CROWNS.id)
		, this.onPlayLord)
		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.LADY_OF_CROWNS.id)
		, this.onPlayLady)

		this.addEventHook(playerFilter
			.type('statusApply')
			.status(oneOf(this.arcanaDamageStatuses))
		, this.onPlayIBuff)

		this.addEventHook('complete', this.onComplete)
	}

	private onDraw(event: Events['action']) {

		// ignore precasted draws
		if (event.timestamp > this.parser.pull.timestamp) {

			this.drawTotalDrift += Math.max(0, event.timestamp - this.cooldownEndTime)

			// update the last use
			this.cooldownEndTime = this.data.actions.ASTRAL_DRAW.cooldown + Math.max(this.cooldownEndTime, event.timestamp) //note UMBRAL and ASTRAL share same CD
			this.draws++
		}
	}

	private onPlayI() {
		this.playIs++
	}

	private onPlayLord() {
		this.playLord++
	}

	private onPlayLady() {
		this.playLady++
	}

	private onPlayIBuff(event: Events['statusApply']) {
		if (event.timestamp > this.parser.pull.timestamp) {
			return
		}
		this.playIs++
	}

	private onComplete() {

		// If they stopped using Draw at any point in the fight, this'll calculate the drift "accurately"
		const fightEnd = this.parser.pull.duration + this.parser.pull.timestamp
		this.drawTotalDrift += Math.max(0, fightEnd - this.cooldownEndTime) - oGCD_ALLOWANCE
		this.drawTotalDrift = Math.min(this.parser.pull.duration, this.drawTotalDrift)

		// Max plays:
		// [(fight time / 30s draw time + 1) - 1 if fight time doesn't end between xx:05-xx:29s, and xx:45-xx:60s]
		// eg 7:00: 14 -1 = 13  draws by default. 7:17 fight time would mean 14 draws, since they can play the last card at least.
		// in otherwords, fightDuration - 15s (for the buff @ CARD_DURATION)

		// Begin Theoretical Max Plays calc
		const playsFromDraw = Math.ceil(Math.max(0, (this.parser.pull.duration - oGCD_ALLOWANCE - INTENTIONAL_DRIFT_FOR_BURST)) / this.data.actions.ASTRAL_DRAW.cooldown)
		const lordPlaysFromDraw = Math.ceil(Math.max(0, (this.parser.pull.duration - oGCD_ALLOWANCE - INTENTIONAL_DRIFT_FOR_BURST)) / (this.data.actions.ASTRAL_DRAW.cooldown * 2)) //*2 done since they share the same cooldown and same button

		// TODO: Include downtime calculation for each fight??

		const theoreticalMaxPlays = playsFromDraw + (this.prepullPrepped ? 1 : 0)
		const lordTheoreticalMaxPlays = lordPlaysFromDraw + (this.prepullPrepped ? 1 : 0)
		const totalCardsObtained = (this.prepullPrepped ? 1 : 0) + this.draws

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
				These cards provide additional damage either directly (<DataLink action="LORD_OF_CROWNS" />) or for the party (<DataLink action="THE_BALANCE" /> / <DataLink action="THE_SPEAR" />).
				<br/>Casting <DataLink action="ASTRAL_DRAW" /> and <DataLink action="UMBRAL_DRAW" /> will help with mana management.
			</Trans>
			<li><Trans id="ast.draw.checklist.description.total">Total cards obtained:</Trans>&nbsp;{totalCardsObtained}/{theoreticalMaxPlays}</li>
			</>,
			tiers: {[warnTarget]: TARGET.WARN, [failTarget]: TARGET.FAIL, [100]: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="ast.draw.checklist.requirement.playI">
						<DataLink action="PLAY_I" /> (<DataLink action="THE_BALANCE" /> / <DataLink action="THE_SPEAR" />) uses
					</Trans>,
					value: this.playIs,
					target: theoreticalMaxPlays,
				}),
				new Requirement({
					name: <Trans id="ast.draw.checklist.requirement.playLord">
						<DataLink action="LORD_OF_CROWNS" /> uses
					</Trans>,
					value: this.playLord,
					target: lordTheoreticalMaxPlays,
				}),
			],
		}))

		const drawsMissed = Math.floor(this.drawTotalDrift / this.data.actions.ASTRAL_DRAW.cooldown)
		if (this.draws === 0) {
		/*
		SUGGESTION: Didn't use draw at all
		*/
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.ASTRAL_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-no-usage.content">
						No uses of <DataLink action="ASTRAL_DRAW" /> or <DataLink action="UMBRAL_DRAW" /> at all.
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
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.ASTRAL_DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-uses.content">
						Consider casting <DataLink action="ASTRAL_DRAW" /> / <DataLink action="UMBRAL_DRAW" /> as soon as its available to maximize both MP regen and the number of cards played.
				</Trans>,
				tiers: SEVERITIES.DRAW_HOLDING,
				value: drawsMissed,
				why: <Trans id="ast.draw.suggestions.draw-uses.why">
					About <Plural value={drawsMissed} one="# use" other="# uses" /> of <DataLink action="ASTRAL_DRAW" /> / <DataLink action="UMBRAL_DRAW" /> <Plural value={drawsMissed} one="was" other="were" /> missed by holding cards on full cooldown for at least a total of {this.parser.formatDuration(this.drawTotalDrift)}.
				</Trans>,
			}))
		}
	}
}
