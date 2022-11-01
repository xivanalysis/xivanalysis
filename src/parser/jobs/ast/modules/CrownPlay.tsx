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
import {MINOR_ARCANA, DRAWN_CROWN_ARCANA} from './ArcanaGroups'

const oGCD_ALLOWANCE = 5000 //used in the case of the last few seconds of the fight. AST would have to use CROWN_PLAY and then use LORD_OF_CROWNS. Therefore, if used between actions, at least two GCDs is necessary for an AST to consider this. Note: lady of crowns is not applicable

const TARGETS = {
	SCORE: {
		70: TARGET.FAIL,
		80: TARGET.WARN,
		90: TARGET.SUCCESS,
	},
	WEIGHT: { //weights chosen such that 1 LORD + 1 LADY = 1 MINOR_ARCANA since MINOR_ARCANA can bring either
		MINOR_ARCANA: 1,
		LORD: 0.8,
		LADY: 0.2,
	},
}

const SEVERITIES = {
	LORD: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	LADY: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	MINOR_ARCANA: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
}

export default class CrownPlay extends Analyser {
	static override handle = 'crown_play'
	static override title = t('ast.crown-play.title')`Crown Play`

	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private lastCrownTimestamp: number = 0
	private minorArcana: number = 0
	private minorArcanaDrift: number = 0
	private minorArcanaTotalDrift: number = 0

	private lastEventType: Event['type'] = 'prepare' //prepare used as default since preparing for module I guess
	private lastCardType: Status['id'] = 0
	private ladyObtained: number = 0
	private ladyCasts: number = 0
	private lordObtained: number = 0
	private lordCasts: number = 0

	private crownActions: Array<Action['id']> = []
	private arcanaStatuses: Array<Status['id']> = []

	override initialise() {

		this.crownActions = MINOR_ARCANA.map(actionKey => this.data.actions[actionKey].id)
		this.arcanaStatuses = DRAWN_CROWN_ARCANA.map(statusKey => this.data.statuses[statusKey].id)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.actions.MINOR_ARCANA.id)
		, this.onMinorArcana)
		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(this.crownActions))
		, this.onCrownAction)

		this.addEventHook(playerFilter
			.type('statusApply')
			.status(oneOf(this.arcanaStatuses))
		, this.onCrownBuff)

		this.addEventHook('complete', this.onComplete)
	}

	private onMinorArcana(event: Events['action']) {

		this.minorArcana++

		if (this.lastCrownTimestamp === 0) {
			// The first use, take holding as from the start of the fight. assumes that crown play is not on CD
			this.minorArcanaDrift = event.timestamp - this.parser.pull.timestamp
		} else {
			// Take holding as from the time it comes off cooldown
			this.minorArcanaDrift = event.timestamp - this.lastCrownTimestamp - this.data.actions.MINOR_ARCANA.cooldown
		}

		// Keep track of total drift time not using crown play
		if (this.minorArcanaDrift > 0) {
			this.minorArcanaTotalDrift += this.minorArcanaDrift
		}

		//catch any cards that were overwritten on the last cast. this only happens if AST redraws the same arcana
		if (this.lastEventType === event.type) {
			if (this.lastCardType === this.data.statuses.LORD_OF_CROWNS_DRAWN.id) { this.lordObtained++ }
			if (this.lastCardType === this.data.statuses.LADY_OF_CROWNS_DRAWN.id) { this.ladyObtained++ }
		}

		// update the last use
		this.lastCrownTimestamp = event.timestamp
		this.lastEventType = event.type
	}

	private onCrownAction(event: Events['action']) {
		if (event.action === this.data.actions.LORD_OF_CROWNS.id) {
			this.lordCasts++
			//to catch prepulls
			if (this.lordObtained === 0 && this.parser.pull.timestamp + this.data.actions.MINOR_ARCANA.cooldown < event.timestamp) { this.lordObtained++ }
		}
		if (event.action === this.data.actions.LADY_OF_CROWNS.id) {
			this.ladyCasts++
			//to catch prepulls
			if (this.ladyObtained === 0 && this.parser.pull.timestamp + this.data.actions.MINOR_ARCANA.cooldown < event.timestamp) { this.ladyObtained++ }
		}
	}

	private onCrownBuff(event: Events['statusApply']) {
		if (event.status === this.data.statuses.LORD_OF_CROWNS_DRAWN.id) {
			this.lordObtained++
			this.lastCardType = this.data.statuses.LORD_OF_CROWNS_DRAWN.id
			this.lastEventType = event.type
		}
		if (event.status === this.data.statuses.LADY_OF_CROWNS_DRAWN.id) {
			this.ladyObtained++
			this.lastCardType = this.data.statuses.LADY_OF_CROWNS_DRAWN.id
			this.lastEventType = event.type
		}
	}

	private onComplete() {

		// If they stopped using crown play at any point in the fight, this'll calculate the drift "accurately"
		const fightEnd = this.parser.pull.duration + this.parser.pull.timestamp
		if (this.lastCrownTimestamp === 0) {
			this.minorArcanaTotalDrift = this.parser.pull.duration
		} else {
			this.minorArcanaTotalDrift += Math.max(0, fightEnd - this.lastCrownTimestamp - this.data.actions.MINOR_ARCANA.cooldown)
		}

		//if they overwrote a card but didn't play another, this will catch the last cast
		if (this.lastEventType === 'action') {
			if (this.lastCardType === this.data.statuses.LORD_OF_CROWNS_DRAWN.id) { this.lordObtained++ }
			if (this.lastCardType === this.data.statuses.LADY_OF_CROWNS_DRAWN.id) { this.ladyObtained++ }
		}

		// Begin Theoretical Max Plays calc		//assumes that crown-play is not on cooldown at the start of the fight
		const playsFromCrownPlay = Math.ceil(Math.max(0, (this.parser.pull.duration - oGCD_ALLOWANCE)) / this.data.actions.MINOR_ARCANA.cooldown)

		//requirements are set up to avoid NaN when either lady or lord obtained = 0
		const requirements = [new Requirement({
			name: <Trans id="ast.crown-play.checklist.requirement.name">
				<DataLink action="MINOR_ARCANA" /> uses
			</Trans>,
			value: this.minorArcana,
			target: playsFromCrownPlay,
			weight: TARGETS.WEIGHT.MINOR_ARCANA,
		})]

		if (this.ladyObtained !== 0) {
			requirements.push(new Requirement({
				name: <Trans id="ast.crown-play.checklist.lady">
					<DataLink action="LADY_OF_CROWNS" /> uses
				</Trans>,
				value: this.ladyCasts,
				target: this.ladyObtained,
				weight: TARGETS.WEIGHT.LADY,
			}))
		}

		if (this.lordObtained !== 0) {
			requirements.push(new Requirement({
				name: <Trans id="ast.crown-play.checklist.lord">
					<DataLink action="LORD_OF_CROWNS" /> uses
				</Trans>,
				value: this.lordCasts,
				target: this.lordObtained,
				weight: TARGETS.WEIGHT.LORD,
			}))
		}

		/*
			CHECKLIST: Number of cards played
		*/
		this.checklist.add(new TieredRule({
			displayOrder: DISPLAY_ORDER.CROWN_PLAY_CHECKLIST,
			name: <Trans id="ast.crown=play.checklist.name">
				Use <DataLink action="MINOR_ARCANA" showIcon={false} /> to your advantage
			</Trans>,
			description: <><Trans id="ast.crown-play.checklist.description">
				Playing <DataLink action="MINOR_ARCANA" /> will allow for extra oGCD damage through <DataLink action="LORD_OF_CROWNS" /> or extra oGCD healing through <DataLink action="LADY_OF_CROWNS" />.
				Try to play <DataLink action="MINOR_ARCANA" /> as much as possible to allow for possible extra damage or extra healing without wasting additional resources.
			</Trans></>,
			tiers: TARGETS.SCORE,
			requirements: requirements,
		}))

		const crownPlaysMissed = Math.floor(this.minorArcanaTotalDrift / this.data.actions.MINOR_ARCANA.cooldown)
		if (this.minorArcana === 0) {
		/*
		SUGGESTION: Didn't use minor arcana at all
		*/
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.MINOR_ARCANA.icon,
				content: <Trans id="ast.crown-play.suggestions.crown-play-no-usage.content">
						No uses of <DataLink action="MINOR_ARCANA" /> at all.
				</Trans>,
				why: <Trans id="ast.crown-play.suggestions.crown-play-no-usage.why">
					No <DataLink action="MINOR_ARCANA" /> used when {crownPlaysMissed} could have been played.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		} else {
		/*
		SUGGESTION: Didn't use minor arcana enough
		*/
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.MINOR_ARCANA.icon,
				content: <Trans id="ast.crown-play.suggestions.crown-play-uses.content">
						Try casting <DataLink action="MINOR_ARCANA" /> as soon as its available to maximize utility of both damage and healing oGCDs.
				</Trans>,
				tiers: SEVERITIES.MINOR_ARCANA,
				value: crownPlaysMissed,
				why: <Trans id="ast.crown-play.suggestions.crown-play-uses.why">
					About <Plural value={crownPlaysMissed} one="# use" other="# uses" /> of <DataLink action="MINOR_ARCANA" /> were missed by holding <DataLink action="MINOR_ARCANA" showIcon={false} /> on full cooldown for at least {this.parser.formatDuration(this.minorArcanaTotalDrift)}.
				</Trans>,
			}))
		}
	}
}
