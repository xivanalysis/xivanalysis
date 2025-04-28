import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Suggestions, SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DISPLAY_ORDER} from 'parser/jobs/ast/modules/DISPLAY_ORDER'
import {PLAY_I} from './ArcanaGroups'

const oGCD_ALLOWANCE = 7500 //used in case the last draw comes up in the last second of the fight. Since plays are typically done in a separate weave, a full GCD would be needed to play the card. Takes another second to cast PLAY and therefore an AST would not DRAW if they couldn't even PLAY. Additionally, an AST would not play if not even a GCD could be cast before the end of the fight. Therefore, the oGCD_ALLOWANCE should be approcimately 3 GCDs (2 for AST to cast, 1 for job to do an action) = 3 * 2500
const INTENTIONAL_DRIFT_FOR_BURST = 7500 //gcds until draw is used in opener
const ADDITIONAL_CD_TO_ALIGN_WITH_DIVINATION = 5000 // 5s chosen since CD is 55s and div is 120s

const SEVERITIES = {
	DRAW_HOLDING: { //harsh thresholds were chosen since a drift will invariably mess up burst alignment
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	OVERWRITE_CARD: {
		1: SEVERITY.MAJOR,
	},
}

export class Draw extends Analyser {
	static override handle = 'draw'
	static override title = t('ast.draw.title')`Draw`

	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private draws: number = 0
	private cooldownEndTime: number = this.parser.pull.timestamp
	private drawTotalDrift: number = 0
	private additionalCD: number = ADDITIONAL_CD_TO_ALIGN_WITH_DIVINATION

	//tracked actions/hooks to be used. note: on prepull balance/lord starts active. tracking spear/balance only through play I
	private playIActive: boolean = true
	private lordActive: boolean = true
	private lordHook: EventHook<Events['action']> | undefined = undefined
	private cardOverwrites: number = 0

	private prepullPrepped: boolean = true //always true

	private playDamageActions: Array<Action['id']> = []

	override initialise() {

		this.playDamageActions = PLAY_I.map(actionKey => this.data.actions[actionKey].id)

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
		this.lordHook = this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.LORD_OF_CROWNS.id)
		, this.onPlayLord)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)

		this.addEventHook('complete', this.onComplete)
	}

	private onDraw(event: Events['action']) {

		// ignore precasted draws
		if (event.timestamp > this.parser.pull.timestamp) {

			this.drawTotalDrift += Math.max(0, event.timestamp - this.cooldownEndTime)

			// update the last use
			this.cooldownEndTime = this.data.actions.ASTRAL_DRAW.cooldown + this.additionalCD + Math.max(this.cooldownEndTime, event.timestamp)
			//note UMBRAL and ASTRAL share same CD and we also want to align with divination
			this.draws++
		}

		//check for any overwrites
		if (this.playIActive || this.lordActive) {
			this.cardOverwrites += 1
		}

		//initialize
		this.playIActive = true
		if (event.action === this.data.actions.ASTRAL_DRAW.id) {
			this.lordActive = true
			if (this.lordHook === undefined) {
				this.lordHook = this.addEventHook(filter<Event>()
					.source(this.parser.actor.id)
					.type('action')
					.action(this.data.actions.LORD_OF_CROWNS.id)
				, this.onPlayLord)
			}
		}
	}

	private onPlayI() {
		this.playIActive = false
	}

	private onPlayLord() {
		if (this.lordHook !== undefined) {
			this.lordHook = undefined
		}
		this.lordActive = false
	}

	private onDeath() {
		// if they die, just set it to false
		if (this.lordHook !== undefined) {
			this.lordHook = undefined
		}
		this.lordActive = false
		this.playIActive = false
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
		const cooldownToConsider: number = this.data.actions.ASTRAL_DRAW.cooldown + this.additionalCD // Additional CD added to align with divination
		const playsFromDraw = Math.ceil(Math.max(0, (this.parser.pull.duration - oGCD_ALLOWANCE - INTENTIONAL_DRIFT_FOR_BURST)) / cooldownToConsider)

		// TODO: Include downtime calculation for each fight??

		const theoreticalMaxPlays = playsFromDraw + (this.prepullPrepped ? 1 : 0)
		const totalCardsObtained = (this.prepullPrepped ? 1 : 0) + this.draws

		/*
			CHECKLIST: Number of cards played
		*/
		this.checklist.add(new Rule({
			displayOrder: DISPLAY_ORDER.DRAW_CHECKLIST,
			name: <Trans id="ast.draw.checklist.name">
				Draw cards in preparation for <DataLink action="DIVINATION" /> windows.
			</Trans>,
			description: <><Trans id="ast.draw.checklist.description">
				These cards provide additional damage either directly (<DataLink action="LORD_OF_CROWNS" />) or for the party (<DataLink action="THE_BALANCE" /> / <DataLink action="THE_SPEAR" />).
				<br/>Cards should be played in alignment with <DataLink action="DIVINATION" /> as much as possible.
				<br/>Casting <DataLink action="ASTRAL_DRAW" /> and <DataLink action="UMBRAL_DRAW" /> will help with mana management.
			</Trans>
			</>,
			requirements: [
				new Requirement({
					name: <Trans id="ast.draw.checklist.description.total">Total cards obtained:</Trans>,
					value: totalCardsObtained,
					target: theoreticalMaxPlays,
				}),
			],
		}))

		const drawsMissed = Math.floor(this.drawTotalDrift / (this.data.actions.ASTRAL_DRAW.cooldown + this.additionalCD))
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
						Consider casting <DataLink action="ASTRAL_DRAW" /> / <DataLink action="UMBRAL_DRAW" /> in a timely manner to align with <DataLink action="DIVINATION" /> to ensure 2 cards are in every window and to help with mana management.
				</Trans>,
				tiers: SEVERITIES.DRAW_HOLDING,
				value: drawsMissed,
				why: <Trans id="ast.draw.suggestions.draw-uses.why">
					About <Plural value={drawsMissed} one="# use" other="# uses" /> of <DataLink action="ASTRAL_DRAW" /> / <DataLink action="UMBRAL_DRAW" /> <Plural value={drawsMissed} one="was" other="were" /> missed by drifting cards outside <DataLink action="DIVINATION" /> for at least a total of {this.parser.formatDuration(this.drawTotalDrift)}.
				</Trans>,
			}))
		}

		/*
		SUGGESTION: Overwrote when cards were available
		*/
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.THE_BALANCE.icon,
			content: <Trans id="ast.draw.suggestions.draw-overwrite.content">
					Try to not use <DataLink action="ASTRAL_DRAW" /> / <DataLink action="UMBRAL_DRAW" /> until you have used <DataLink action="PLAY_I" /> and <DataLink action="LORD_OF_CROWNS" />.
			</Trans>,
			tiers: SEVERITIES.OVERWRITE_CARD,
			value: this.cardOverwrites,
			why: <Trans id="ast.draw.suggestions.draw-overwrite.why">
				<DataLink action="ASTRAL_DRAW" /> / <DataLink action="UMBRAL_DRAW" /> was used <Plural value={this.cardOverwrites} one="once" other="# times" /> when there was an available <DataLink action="PLAY_I" /> or <DataLink action="LORD_OF_CROWNS" />.
			</Trans>,
		}))
	}
}
