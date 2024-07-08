import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actor} from 'parser/core/modules/Actors'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {OFFENSIVE_ARCANA_STATUS} from './ArcanaGroups'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {ExpectedCardsEvaluator} from './evaluators/ExpectedCardsEvaluator'
import {LightspeedEvaluator} from './evaluators/LightspeedEvaluator'

export interface DivinationMetadata {
	cardsInWindow: number
	lightspeed: boolean
	astrodyne: boolean
	possibleLord: number,
}

const BASE_GCDS_PER_WINDOW = 6
const MINOR_ARCANA_GCD_ALLOWANCE = 3.5 //seconds allowable for minor arcana to be available during divination window for it to count towards a penalty of lord of crowns. 3.5s was chosen as if it comes up within a gcd of divination still being up (plus the oGCD to cast it), it will still be castable during the burst window even if it is tight

export class Divination extends RaidBuffWindow {
	static override handle = 'Divination'
	static override title = t('ast.divination.title')`Divination`
	static override displayOrder = DISPLAY_ORDER.DIVINATION

	@dependency private globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.DIVINATION

	private currentCardsPlayed: Array<Actor['id']> = []
	private metadataHistory = new History<DivinationMetadata>(() => ({
		cardsInWindow: this.currentCardsPlayed.length,
		lightspeed: false,
		astrodyne: false,
		possibleLord: 0,
	}))

	//note the following hooks are possible because lightspeed, astrodyne, cards, and divination have a 15s duration. if divination was shorter then we would need to set up the hooks differently. this is noted here in case divination or any of the above actions gets extended.
	private lightspeedApplyHook?: EventHook<Events['statusApply']>
	private lightspeedRemoveHook?: EventHook<Events['statusRemove']>
	private astrodyneApplyHook?: EventHook<Events['statusApply']>
	private astrodyneRemoveHook?: EventHook<Events['statusRemove']>

	//for lords and minor arcana
	private lastMAcast?: number
	private lastLordCast?: number
	private lordHeld: boolean = false
	private ladyStatusHook?: EventHook<Events['statusApply']>

	override prependMessages = <Message>
		<Trans id="ast.divinationwindow.description">
			<DataLink action="DIVINATION" /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it. <br />
			Additionally, an AST wants to aim to <DataLink action="PLAY_I" /> as many cards as possible, use , and use <DataLink action="LORD_OF_CROWNS" /> if available* during burst windows. With many oGCD actions necessary in such a short window, <DataLink action="LIGHTSPEED" /> is required to fit in every action within the <DataLink action="DIVINATION" showIcon={false} /> window.
		</Trans>
	</Message>

	override appendMessages = <Message>
		<Trans id="ast.divinationwindow.footnote">
			* - <DataLink action="MINOR_ARCANA" /> available up to the last {MINOR_ARCANA_GCD_ALLOWANCE}s duration of <DataLink action="DIVINATION" showIcon={false} /> during the window will count towards the <DataLink action="LORD_OF_CROWNS" showIcon={false} /> counter in the table since it could be a <DataLink action="LORD_OF_CROWNS" showIcon={false} />. {MINOR_ARCANA_GCD_ALLOWANCE}s was chosen to align with the standard 2.5 GCD cast time plus 1 second to actually cast <DataLink action="MINOR_ARCANA" showIcon={false} /> prior to the last GCD. <br />
			** - If a <DataLink action="LORD_OF_CROWNS" showIcon={false} /> was cast prior to <DataLink action="MINOR_ARCANA" showIcon={false} /> being off cooldown and could have been available during <DataLink action="DIVINATION" showIcon={false} /> then this is also counted towards <DataLink action="LORD_OF_CROWNS" showIcon={false} />. Keep in mind whether this judgment is appropriate based on whether the <DataLink action="LORD_OF_CROWNS" showIcon={false} /> could have been used on a group of enemies. <br />
			*** - rotation shown is during <DataLink action="DIVINATION" showIcon={false} /> window. Where an action is activated outside the window, but is active in the window, the action is counted. For example: cards played before and expires after <DataLink action="DIVINATION" showIcon={false} /> is cast.
		</Trans>
	</Message>

	override initialise() {
		super.initialise()

		const teamMembers = this.parser.pull.actors.filter(actor => actor.playerControlled).map(actor => actor.id)
		const arcanaStatuses = OFFENSIVE_ARCANA_STATUS.map(statusKey => this.data.statuses[statusKey].id)

		//counting minor arcana and lords
		this.addEventHook(
			filter<Event>()
				.type('action')
				.action(this.data.actions.MINOR_ARCANA.id)
			, this.onMinorArcanaCast)
		this.addEventHook(
			filter<Event>()
				.type('action')
				.action(this.data.actions.LORD_OF_CROWNS.id)
			, this.onLordCast)
		this.addEventHook(
			filter<Event>()
				.type('statusApply')
				.status(this.data.statuses.LORD_OF_CROWNS_DRAWN.id)
			, this.onLordObtain)
		this.addEventHook(
			filter<Event>()
				.type('statusRemove')
				.status(this.data.statuses.LORD_OF_CROWNS_DRAWN.id)
			, this.onLordRemove)

		//for cards being played. note: a hook is set up regardless of windows because if setting up hooks only in the divination window, there would have to be many considerations such as death. As a result, this set up becomes simpler logically for card tracking for divination
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusApply')
				.status(oneOf(arcanaStatuses))
				.target(oneOf(teamMembers)),
			this.onCard)
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusRemove')
				.status(oneOf(arcanaStatuses))
				.target(oneOf(teamMembers)),
			this.offCard)

		this.addEventHook('complete', this.onComplete)

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: BASE_GCDS_PER_WINDOW,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon: '',
			suggestionContent: <></>,
			suggestionWindowName: <></>,
			severityTiers: [],
		}))

		this.addEvaluator(new ExpectedCardsEvaluator({
			metadataHistory: this.metadataHistory,
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.LORD_OF_CROWNS,
					expectedPerWindow: 0,
				},
			],
			suggestionIcon: '',
			suggestionContent: <></>,
			suggestionWindowName: <></>,
			severityTiers: [],
			adjustCount: this.adjustExpectedLordsCount.bind(this),
			// adjustOutcome: this.adjustExpectedLordsOutcome.bind(this),
		}))

		this.addEvaluator(new LightspeedEvaluator({
			metdataHistory: this.metadataHistory,
			suggestionIcon: this.data.actions.LIGHTSPEED.icon,
		}))

	}

	private adjustExpectedLordsCount(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)
		if (windowMetadata == null) { return 0 }
		return windowMetadata.data.possibleLord
	}

	override onWindowStart(timestamp: number) {
		super.onWindowStart(timestamp)
		const currentMetadata = this.metadataHistory.getCurrentOrOpenNew(timestamp)

		//where there is an MA available in the window (i.e. CD is less than div window minus the allowance, then count an additional lord unless a lady of crowns is obtained in the window)
		if (this.lastMAcast == null ||
			this.lastMAcast + this.data.actions.MINOR_ARCANA.cooldown + MINOR_ARCANA_GCD_ALLOWANCE * 1000 < currentMetadata.start + this.data.statuses.DIVINATION.duration) {
			currentMetadata.data.possibleLord += 1
			this.ladyStatusHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('statusApply')
					.status(this.data.statuses.LADY_OF_CROWNS_DRAWN.id),
				this.onLadyObtain,
			)
		}

		//add a possible lord if the last lord cast was before divination even though the MA cooldown would have been during or after the divination window
		if ((this.lastMAcast != null && this.lastLordCast != null
			&& this.lastMAcast + this.data.actions.MINOR_ARCANA.cooldown > currentMetadata.start
			&& this.lastLordCast > this.lastMAcast)
			|| (this.lordHeld)) {
			currentMetadata.data.possibleLord += 1
		}

		this.lightspeedApplyHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusApply')
				.status(this.data.statuses.LIGHTSPEED.id),
			this.onLightspeed,
		)
		this.lightspeedRemoveHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusRemove')
				.status(this.data.statuses.LIGHTSPEED.id),
			this.onLightspeed,
		)
	}

	override onWindowEnd(timestamp: number) {
		super.onWindowEnd(timestamp)
		this.metadataHistory.closeCurrent(timestamp)

		if (this.lightspeedApplyHook != null) {
			this.removeEventHook(this.lightspeedApplyHook)
			this.lightspeedApplyHook = undefined
		}
		if (this.lightspeedRemoveHook != null) {
			this.removeEventHook(this.lightspeedRemoveHook)
			this.lightspeedRemoveHook = undefined
		}
		if (this.astrodyneApplyHook != null) {
			this.removeEventHook(this.astrodyneApplyHook)
			this.astrodyneApplyHook = undefined
		}
		if (this.astrodyneRemoveHook != null) {
			this.removeEventHook(this.astrodyneRemoveHook)
			this.astrodyneRemoveHook = undefined
		}
		if (this.ladyStatusHook != null) {
			this.removeEventHook(this.ladyStatusHook)
			this.ladyStatusHook = undefined
		}
	}

	private onLightspeed() {
		const currentWindow = this.metadataHistory.getCurrent()?.data
		if (currentWindow == null) { return }
		currentWindow.lightspeed = true
	}

	/*
	* card shenanigans
	*/
	private onCard(event: Events['statusApply']) {
		this.currentCardsPlayed.push(event.target)
		const currentWindow = this.metadataHistory.getCurrent()
		if (currentWindow == null) { return } //no window stop
		currentWindow.data.cardsInWindow += 1
	}

	private offCard(event: Events['statusRemove']) {
		this.currentCardsPlayed = this.currentCardsPlayed.filter(actor => actor !== event.target)
	}

	/*
	* minor arcana and lord
	*/
	//obtain last MA cast for divination window tracking purposes
	private onMinorArcanaCast(event: Events['action']) { this.lastMAcast = event.timestamp }

	private onLordCast(event: Events['action']) {
		this.lastLordCast = event.timestamp
	}

	private onLordObtain() { this.lordHeld = true }

	private onLordRemove() { this.lordHeld = false }

	private onLadyObtain() {
		const currentWindow = this.metadataHistory.getCurrent()?.data
		if (currentWindow == null || currentWindow.possibleLord === 0) { return }
		currentWindow.possibleLord -= 1
	}

	override output() {
		if (this.history.entries.length === 0) {
			return <>
				{this.prependMessages}
				<Message error icon>
					<Icon name="remove"/>
					<Message.Content>
						<Trans id="ast.divination.messages.no-casts"> There were no casts recorded for <DataLink action="DIVINATION" />.</Trans>
					</Message.Content>
				</Message>
				{this.appendMessages}
			</>
		}
		return super.output()
	}
}
