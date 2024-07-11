import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {History} from 'parser/core/modules/ActionWindow/History'
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
	lightspeed: boolean,
}

const BASE_GCDS_PER_WINDOW = 8

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
	}))

	//note the following hooks are possible because lightspeed, astrodyne, cards, and divination have a 15s duration. if divination was shorter then we would need to set up the hooks differently. this is noted here in case divination or any of the above actions gets extended.
	private lightspeedApplyHook?: EventHook<Events['statusApply']>
	private lightspeedRemoveHook?: EventHook<Events['statusRemove']>

	override prependMessages = <Message>
		<Trans id="ast.divinationwindow.description">
			<DataLink action="DIVINATION" /> provides an Astrologian with a strong amount of raid DPS when stacked together with arcanum. <br />
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it. <br />
			Additionally, an AST wants to aim to <DataLink action="PLAY_I" />* as many cards as possible, use damage actions (<DataLink action="ORACLE" /> / <DataLink action="LORD_OF_CROWNS" /> / <DataLink action="COMBUST_III" /> **) during burst windows. <br />
			With many oGCD actions necessary in such a short window, <DataLink action="LIGHTSPEED" /> is required to fit in every action within the <DataLink action="DIVINATION" showIcon={false} /> window.
		</Trans>
	</Message>

	override appendMessages = <Message>
		<Trans id="ast.divinationwindow.footnote1">
			* - rotation shown is during <DataLink action="DIVINATION" showIcon={false} /> window. Where <DataLink action="PLAY_I" /> is activated outside the window, but is active in the window, the action is counted. For example: cards played before and expires after <DataLink action="DIVINATION" showIcon={false} /> is cast. <br />
		</Trans>
		<Trans id="ast.divinationwindow.footnote2">
			** - <DataLink action="COMBUST_III" /> is recommended to be used as close to the end of the burst window while all party buffs are up even if the DoT clips itself or during the party-buff window if it is going to expire. <br />
		</Trans>
	</Message>

	override initialise() {
		super.initialise()

		const teamMembers = this.parser.pull.actors.filter(actor => actor.playerControlled).map(actor => actor.id)
		const arcanaStatuses = OFFENSIVE_ARCANA_STATUS.map(statusKey => this.data.statuses[statusKey].id)

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
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.ORACLE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.COMBUST_III,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: '',
			suggestionContent: <></>,
			suggestionWindowName: <></>,
			severityTiers: [],
		}))

		this.addEvaluator(new LightspeedEvaluator({
			metdataHistory: this.metadataHistory,
			suggestionIcon: this.data.actions.LIGHTSPEED.icon,
		}))

	}

	override onWindowStart(timestamp: number) {
		super.onWindowStart(timestamp)
		this.metadataHistory.getCurrentOrOpenNew(timestamp)

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
