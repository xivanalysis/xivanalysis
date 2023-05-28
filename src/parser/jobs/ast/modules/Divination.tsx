import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ARCANA_STATUSES} from './ArcanaGroups'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BASE_GCDS_PER_WINDOW = 6
const PLAYERS_BUFFED_TARGET = 8
const TARGET_CARDS_PLAYED = 3 //used to get the target for amount of cards played in window
const MINOR_ARCANA_GCD_ALLOWANCE = 3.5 //seconds allowable for minor arcana to be available during divination window for it to count towards a penalty of lord of crowns. 3.5s was chosen as if it comes up within a gcd of divination still being up (plus the oGCD to cast it), it will still be castable during the burst window even if it is tight

interface DivinationWindow {
	start: number
	end?: number
	source: Actor['id']

	rotation: Array<Events['action']>
	gcdCount: number
	trailingGcdEvent?: Events['action']
	playersBuffed: Array<Actor['id']>
	overlap: boolean
	lightspeed: boolean
	astrodyne: boolean
	lord: number //technically you could get up to two lords in the window
	possibleLord: number //the amount of lords technically feasible. Note: any unused MA are counted towards this.
	cardsInWindow: number //number of cards played in window can hold up to 3 for bursts
}

// in this module we only want to track Divination windows opened by the character selected for analysis. windows that clip into AST Divination will be marked.
// Used DNC Technicalities as basis for this module. Rewritten from previous module for consistency purposes
export class Divination extends Analyser {
	static override handle = 'Divination'
	static override title = t('ast.divination.title')`Divination`
	static override displayOrder = DISPLAY_ORDER.DIVINATION

	@dependency private timeline!: Timeline
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

	private history: DivinationWindow[] = []
	private currentWindow: DivinationWindow | undefined = undefined
	private castHook?: EventHook<Events['action']>

	//note the following hooks are possible because lightspeed, astrodyne, cards, and divination have a 15s duration. if divination was shorter then we would need to set up the hooks differently. this is noted here in case divination or any of the above actions gets extended.
	private lightspeedApplyHook?: EventHook<Events['statusApply']>
	private lightspeedRemoveHook?: EventHook<Events['statusRemove']>
	private astrodyneApplyHook?: EventHook<Events['statusApply']>
	private astrodyneRemoveHook?: EventHook<Events['statusRemove']>
	private teamMembers: Array<Actor['id']> = []

	//cards
	private arcanaStatuses: Array<Status['id']> = []
	private currentCardsPlayed: Array<Actor['id']> = []

	//for lords and minor arcana
	private lastMAcast?: number
	private lastLordCast?: number
	private lordHeld: boolean = false
	private ladyStatusHook?: EventHook<Events['statusApply']>

	private otherAst: {
		timeOverwritten: number,
		countOverwritten: number,
		active: boolean,
		start: number
	} = {
		timeOverwritten: 0,
		countOverwritten: 0,
		active: false,
		start: 0,
	}

	override initialise() {
		const divinationFilter = filter<Event>().status(this.data.statuses.DIVINATION.id)
		this.teamMembers = this.parser.pull.actors.filter(actor => actor.playerControlled).map(actor => actor.id)
		this.arcanaStatuses = ARCANA_STATUSES.map(statusKey => this.data.statuses[statusKey].id)

		this.addEventHook(divinationFilter.source(this.parser.actor.id), this.countDivinationBuffs)
		this.addEventHook(divinationFilter.type('statusApply')
			.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(divinationFilter.type('statusRemove')
			.target(this.parser.actor.id), this.tryCloseWindow)

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
				.status(oneOf(this.arcanaStatuses))
				.target(oneOf(this.teamMembers)),
			this.onCard)
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusRemove')
				.status(oneOf(this.arcanaStatuses))
				.target(oneOf(this.teamMembers)),
			this.offCard)

		this.addEventHook('complete', this.onComplete)
	}

	private countDivinationBuffs(event: Events['statusApply']) {
		if (this.currentWindow != null && !this.currentWindow.playersBuffed.includes(event.target) && this.actors.get(event.target).playerControlled) {
			this.currentWindow.playersBuffed.push(event.target)
		}
	}

	private tryOpenWindow(event: Events['statusApply']) {
		//open window for other AST
		if (this.parser.actor.id !== event.source) {
			this.otherAst.active = true
			this.otherAst.start = event.timestamp
			//if window was open. close it prematurely since now dealing with other AST window :(
			if (this.currentWindow != null) {
				this.forceCloseWindow(event.timestamp)
			}
		}

		if (this.currentWindow === undefined && this.parser.actor.id === event.source) {
			//open window for ast
			this.currentWindow = {
				start: event.timestamp,
				rotation: [],
				gcdCount: 0,
				source: event.source,

				playersBuffed: [],
				overlap: false,

				lightspeed: false,
				lord: 0,
				possibleLord: 0,
				astrodyne: false,
				cardsInWindow: this.currentCardsPlayed.length, //cards in the window starts with the number of cards played at the beginning of the window
			}

			//where there is an MA available in the window (i.e. CD is less than div window minus the allowance, then count an additional lord unless a lady of crowns is obtained in the window)
			if (this.lastMAcast == null ||
				this.lastMAcast + this.data.actions.MINOR_ARCANA.cooldown + MINOR_ARCANA_GCD_ALLOWANCE * 1000 < this.currentWindow.start + this.data.statuses.DIVINATION.duration) {
				this.currentWindow.possibleLord += 1
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
				&& this.lastMAcast + this.data.actions.MINOR_ARCANA.cooldown > this.currentWindow.start
				&& this.lastLordCast > this.lastMAcast)
				|| (this.lordHeld)) {
				this.currentWindow.possibleLord += 1
			}

			//set up hooks related to above set up
			this.castHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action'),
				this.onCast,
			)
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
			this.astrodyneApplyHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('statusApply')
					.status(this.data.statuses.HARMONY_OF_SPIRIT.id),
				this.onAstrodyne,
			)
			this.astrodyneRemoveHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('statusRemove')
					.status(this.data.statuses.HARMONY_OF_SPIRIT.id),
				this.onAstrodyne,
			)

			//to set other ast information if active and overwritten
			//note assumption that overwritten happens if duration hasn't passed
			if (this.data.statuses.DIVINATION.duration > this.currentWindow.start - this.otherAst.start) {
				this.otherAst.countOverwritten++
				this.otherAst.timeOverwritten += (this.otherAst.start + this.data.statuses.DIVINATION.duration) - event.timestamp
				this.currentWindow.overlap = true
			}
			this.otherAst.active = false
			this.otherAst.start = 0
		}
	}

	private tryCloseWindow(event: Events['statusRemove']) {
		//note: closing other AST window handled in open window since closing the window doesn't catch what we need because status remove happens before status apply
		//close window and push to history
		if (event.source === this.parser.actor.id) {
			this.forceCloseWindow(event.timestamp)
		}
	}

	private forceCloseWindow(timestamp: number) {
		//to stop using function if window isn't even open. used when splicing
		if (this.currentWindow == null) { return }

		this.currentWindow.end = timestamp
		this.history.push(this.currentWindow)
		this.currentWindow = undefined

		//remove relevant hooks
		if (this.castHook != null) {
			this.removeEventHook(this.castHook)
			this.castHook = undefined
		}
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

	private onCast(event: Events['action']) {

		// If we don't have a window, bail
		if (this.currentWindow == null) { return }

		const action = this.data.getAction(event.action)

		// Can't do anything else if we didn't get a valid action object
		if (action == null) { return }

		// Add the action to the list
		this.currentWindow.rotation.push(event)

		if (action.onGcd) {
			this.currentWindow.gcdCount++

			// If we haven't recorded a trailing GCD event for this closed window, do so now
			if (this.currentWindow.end != null && this.currentWindow.trailingGcdEvent == null) {
				this.currentWindow.trailingGcdEvent = event
			}
		}
	}

	/*
	* other attributes to track
	*/
	private onLightspeed() {
		if (this.currentWindow === undefined) { return }
		this.currentWindow.lightspeed = true
	}

	private onAstrodyne() {
		if (this.currentWindow === undefined) { return }
		this.currentWindow.astrodyne = true
	}

	/*
	* card shenanigans
	*/
	private onCard(event: Events['statusApply']) {
		this.currentCardsPlayed.push(event.target)
		if (this.currentWindow === undefined) { return } //no window stop
		this.currentWindow.cardsInWindow += 1
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
		if (this.currentWindow === undefined) { return }
		this.currentWindow.lord += 1
	}

	private onLordObtain() { this.lordHeld = true }

	private onLordRemove() { this.lordHeld = false }

	private onLadyObtain() {
		if (this.currentWindow === undefined || this.currentWindow.possibleLord === 0) { return }
		this.currentWindow.possibleLord -= 1
	}

	/*
	* complete
	*/
	private onComplete() {
		if (this.otherAst.countOverwritten !== 0) {
			/*
				SUGGESTION: Overwriting other AST's divination
			*/
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.DIVINATION.icon,
				content: <Trans id="ast.divination.suggestion.usage.content">
					Consider coordinating with your co-Astrologian to maximize the amount of time <DataLink action="DIVINATION" /> is up so the party can benefit from extra damage for longer.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="ast.divination.suggestion.usage.why">
					{this.otherAst.countOverwritten} <Plural value={this.otherAst.countOverwritten} one="cast" other="casts" /> of <DataLink action="DIVINATION" /> were overwritten resulting in a loss of at least {this.parser.formatDuration(this.otherAst.timeOverwritten)}.
				</Trans>,
			}))
		}

		const unusedLightspeed: number = this.history.filter(window => !window.lightspeed).length
		if (unusedLightspeed !== 0) {
			/*
				SUGGESTION: not using lightspeed in any divination window
			*/
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.LIGHTSPEED.icon,
				content: <Trans id="ast.divination.suggestion.lightspeed.usage.content">
					<DataLink action="LIGHTSPEED" /> is necessary for every <DataLink action="DIVINATION" /> window to use the many oGCD actions to maximize potential raid damage output. Use <DataLink action="LIGHTSPEED" showIcon={false} /> around <DataLink action="DIVINATION" showIcon={false} /> windows to ensure all applicable actions are able to fit within.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="ast.divination.suggestion.lightspeed.usage.why">
					{unusedLightspeed} <Plural value={unusedLightspeed} one="cast" other="casts" /> of <DataLink action="LIGHTSPEED" /> were missed during <DataLink action="DIVINATION" /> windows resulting in lost actions during burst phases.
				</Trans>,
			}))
		}
	}

	override output() {

		//in the case when the encounter ends prior to status remove. splicing the event to log it. note: since close event checks for null, this will not be applicable if the window isn't already open
		this.forceCloseWindow(this.parser.pull.duration)

		const tableData = this.history.map(window => {
			const end = window.end != null ?
				window.end - this.parser.pull.timestamp :
				this.parser.pull.duration
			const start = window.start - this.parser.pull.timestamp

			return ({
				start,
				end,
				rotation: window.rotation,
				targetsData: {
					gcds: {
						actual: window.gcdCount,
						expected: (BASE_GCDS_PER_WINDOW),
					},
					playersBuffed: {
						actual: window.playersBuffed.length,
						expected: (PLAYERS_BUFFED_TARGET),
					},
					cardsPlayed: {
						actual: window.cardsInWindow,
						expected: TARGET_CARDS_PLAYED,
					},
					lordsUsed: {
						actual: window.lord,
						expected: window.possibleLord,
					},
				},
				notesMap: {
					otherAst: <>{this.getNotesIcon(window.overlap)}</>,
					lightspeedActive: <>{this.getNotesIconWithCheck(window.lightspeed)}</>,
					astrodyneActive: <>{this.getNotesIconWithCheck(window.astrodyne)}</>,
				},
			})
		})

		const actualCasts = tableData.length
		const noCastsMessage = <p><span className="text-error"><Trans id="ast.divination.messages.no-casts"> There were no casts recorded for <DataLink action="DIVINATION" />.</Trans></span></p>

		const message = <p><Trans id="ast.divination.description">
			<DataLink action="DIVINATION" /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it. <br />
			Additionally, an AST wants to aim to <DataLink action="PLAY" /> as many cards as possible, use <DataLink action="ASTRODYNE" />, and use <DataLink action="LORD_OF_CROWNS" /> if available* during burst windows. With many oGCD actions necessary in such a short window, <DataLink action="LIGHTSPEED" /> is required to fit in every action within the <DataLink action="DIVINATION" showIcon={false} /> window.
		</Trans></p>

		const footnote = <p><Trans id="ast.divination.footnote">
			* - <DataLink action="MINOR_ARCANA" /> available up to the last {MINOR_ARCANA_GCD_ALLOWANCE}s duration of <DataLink action="DIVINATION" showIcon={false} /> during the window will count towards the <DataLink action="LORD_OF_CROWNS" showIcon={false} /> counter in the table since it could be a <DataLink action="LORD_OF_CROWNS" showIcon={false} />. {MINOR_ARCANA_GCD_ALLOWANCE}s was chosen to align with the standard 2.5 GCD cast time plus 1 second to actually cast <DataLink action="MINOR_ARCANA" showIcon={false} /> prior to the last GCD. <br />
			** - If a <DataLink action="LORD_OF_CROWNS" showIcon={false} /> was cast prior to <DataLink action="MINOR_ARCANA" showIcon={false} /> being off cooldown and could have been available during <DataLink action="DIVINATION" showIcon={false} /> then this is also counted towards <DataLink action="LORD_OF_CROWNS" showIcon={false} />. Keep in mind whether this judgment is appropriate based on whether the <DataLink action="LORD_OF_CROWNS" showIcon={false} /> could have been used on a group of enemies. <br />
			*** - rotation shown is during <DataLink action="DIVINATION" showIcon={false} /> window. Where an action is activated outside the window, but is active in the window, the action is counted. For example: cards played before and expires after <DataLink action="DIVINATION" showIcon={false} /> is cast.
		</Trans></p>

		if (this.otherAst.countOverwritten !== 0) {
			return <Fragment>
				{message}
				{<RotationTable
					targets={[
						{
							header: <Trans id="ast.arcana-tracking.divination.playertarget">{'Players Buffed'}</Trans>,
							accessor: 'playersBuffed',
						},
						{
							header: <Trans id="ast.divination.rotation-table.header.gcd-count">GCDs</Trans>,
							accessor: 'gcds',
						},
						{
							header: <DataLink action="PLAY" showName={false} />,
							accessor: 'cardsPlayed',
						},
						{
							header: <DataLink action="LORD_OF_CROWNS" showName={false} />,
							accessor: 'lordsUsed',
						},
					]}
					notes = {[
						{
							header: <Trans id="ast.divination.rotation-table.header.overwrite">Overwrote other AST</Trans>,
							accessor: 'otherAst',
						},
						{
							header: <DataLink action="LIGHTSPEED" showName={false} />,
							accessor: 'lightspeedActive',
						},
						{
							header: <DataLink action="ASTRODYNE" showName={false} />,
							accessor: 'astrodyneActive',
						},
					]}
					data={tableData}
					onGoto={this.timeline.show}
				/>}
				{footnote}
			</Fragment>
		}
		return <Fragment>
			{message}
			{actualCasts > 0 ? '' : <Message>{noCastsMessage}</Message>}
			{actualCasts > 0 ?
				<RotationTable
					targets={[
						{
							header: <Trans id="ast.arcana-tracking.divination.playertarget">{'Players Buffed'}</Trans>,
							accessor: 'playersBuffed',
						},
						{
							header: <Trans id="ast.divination.rotation-table.header.gcd-count">GCDs</Trans>,
							accessor: 'gcds',
						},
						{
							header: <DataLink action="PLAY" showName={false} />,
							accessor: 'cardsPlayed',
						},
						{
							header: <DataLink action="LORD_OF_CROWNS" showName={false} />,
							accessor: 'lordsUsed',
						},
					]}
					notes = {[
						{
							header: <DataLink action="LIGHTSPEED" showName={false} />,
							accessor: 'lightspeedActive',
						},
						{
							header: <DataLink action="ASTRODYNE" showName={false} />,
							accessor: 'astrodyneActive',
						},
					]}
					data={tableData}
					onGoto={this.timeline.show}
				/>
				: ''}
			{footnote}
		</Fragment>
	}

	private getNotesIcon(ruleFailed: boolean) {
		return ruleFailed ? <Icon
			name={'remove'}
			className={'text-error'}
		/>
			: ''
	}

	private getNotesIconWithCheck(rulePassed: boolean) {
		return <Icon
			name={rulePassed ? 'checkmark' : 'remove'}
			className={rulePassed ? 'text-success' : 'text-error'}
		/>
	}
}
