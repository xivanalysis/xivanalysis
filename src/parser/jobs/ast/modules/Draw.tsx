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
import {ARCANA_STATUSES, PLAY} from './ArcanaGroups'
import ArcanaTracking from './ArcanaTracking/ArcanaTracking'

const oGCD_ALLOWANCE = 7500 //used in case the last draw comes up in the last second of the fight. Since plays are typically done in a separate weave, a full GCD would be needed to play the card. Takes another second to cast PLAY and therefore an AST would not DRAW if they couldn't even PLAY. Additionally, an AST would not play if not even a GCD could be cast before the end of the fight. Therefore, the oGCD_ALLOWANCE should be approcimately 3 GCDs (2 for AST to cast, 1 for job to do an action) = 3 * 2500

const WARN_TARGET_MAXPLAYS = 2
const FAIL_TARGET_MAXPLAYS = 3

const SEVERITIES = {
	DRAW_HOLDING: { //low thresholds were chosen since draw's charges allow for greater flexibility
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
}

export default class Draw extends Analyser {
	static override handle = 'draw'
	static override title = t('ast.draw.title')`Draw`

	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private arcanaTracking!: ArcanaTracking

	private draws: number = 0
	private cooldownEndTime: number = this.parser.pull.timestamp
	private drawTotalDrift: number = 0
	private plays: number = 0

	private prepullPrepped: boolean = false

	private playActions: Array<Action['id']> = []
	private arcanaStatuses: Array<Status['id']> = []

	override initialise() {

		this.playActions = PLAY.map(actionKey => this.data.actions[actionKey].id)
		this.arcanaStatuses = ARCANA_STATUSES.map(statusKey => this.data.statuses[statusKey].id)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.DRAW.id)
		, this.onDraw)
		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(this.playActions))
		, this.onPlay)

		this.addEventHook(playerFilter
			.type('statusApply')
			.status(oneOf(this.arcanaStatuses))
		, this.onPlayBuff)

		this.addEventHook('complete', this.onComplete)
	}

	private onDraw(event: Events['action']) {

		// ignore precasted draws
		if (event.timestamp > this.parser.pull.timestamp) {

			this.drawTotalDrift += Math.max(0, event.timestamp - this.cooldownEndTime)

			// update the last use
			this.cooldownEndTime = this.data.actions.DRAW.cooldown + Math.max(this.cooldownEndTime, event.timestamp)
			this.draws++
		}
	}

	private onPlay() {
		this.plays++
	}

	private onPlayBuff(event: Events['statusApply']) {
		if (event.timestamp > this.parser.pull.timestamp) {
			return
		}
		this.prepullPrepped = true
		this.plays++
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

		// Begin Theoretical Max Plays calc		//assumes that draw is not on cooldown at the start of the fight
		const playsFromDraw = Math.ceil(Math.max(0, (this.parser.pull.duration - oGCD_ALLOWANCE)) / this.data.actions.DRAW.cooldown) + (this.data.actions.DRAW.charges - 1)

		// TODO: Include downtime calculation for each fight??
		// TODO: Suggest how to redraw effectively (maybe in ArcanaSuggestions)

		// Confirm they had preprepped a card on pull
		const pullState = this.arcanaTracking.getPullState()
		this.prepullPrepped = !!pullState.drawState

		const theoreticalMaxPlays = playsFromDraw + (this.prepullPrepped ? 1 : 0)
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
				Playing cards provides seals for <DataLink action="ASTRODYNE" /> and casting <DataLink action="DRAW" /> will help with mana management.
			</Trans>
			<ul>
				<li><Trans id="ast.draw.checklist.description.prepull">Prepared before pull:</Trans>&nbsp;{this.prepullPrepped ? 1 : 0}/1</li>
				<li><Trans id="ast.draw.checklist.description.draws">Obtained from <DataLink action="DRAW" />:</Trans>&nbsp;{this.draws}/{playsFromDraw}</li>
				<li><Trans id="ast.draw.checklist.description.total">Total cards obtained:</Trans>&nbsp;{totalCardsObtained}/{theoreticalMaxPlays}</li>
			</ul></>,
			tiers: {[warnTarget]: TARGET.WARN, [failTarget]: TARGET.FAIL, [100]: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="ast.draw.checklist.requirement.name">
						<DataLink action="PLAY" /> uses
					</Trans>,
					value: this.plays,
					target: theoreticalMaxPlays,
				}),
			],
		}))

		const drawsMissed = Math.floor(this.drawTotalDrift / this.data.actions.DRAW.cooldown)
		if (this.draws === 0) {
		/*
		SUGGESTION: Didn't use draw at all
		*/
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-no-usage.content">
						No uses of <DataLink action="DRAW" /> at all.
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
				icon: this.data.actions.DRAW.icon,
				content: <Trans id="ast.draw.suggestions.draw-uses.content">
						Consider casting <DataLink action="DRAW" /> as soon as its available to maximize both MP regen and the number of cards played.
				</Trans>,
				tiers: SEVERITIES.DRAW_HOLDING,
				value: drawsMissed,
				why: <Trans id="ast.draw.suggestions.draw-uses.why">
					About <Plural value={drawsMissed} one="# use" other="# uses" /> of <DataLink action="DRAW" /> <Plural value={drawsMissed} one="was" other="were" /> missed by holding two cards on full cooldown for at least a total of {this.parser.formatDuration(this.drawTotalDrift)}.
				</Trans>,
			}))
		}
	}
}
