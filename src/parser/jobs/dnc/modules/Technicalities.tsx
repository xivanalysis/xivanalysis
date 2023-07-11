import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {TECHNICAL_FINISHES} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {Gauge} from './Gauge'

// Harsher than the default since you'll only have 4-5 total windows anyways
const TECHNICAL_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const WINDOW_STATUSES: StatusKey[] = [
	'DEVILMENT',
	'TECHNICAL_FINISH',
]

const FEATHER_THRESHHOLD = 3
const POST_WINDOW_GRACE_PERIOD_MILLIS = 500

class TechnicalWindow {
	start: number
	end?: number

	rotation: Array<Events['action']> = []
	gcdCount: number = 0
	trailingGcdEvent?: Events['action']

	usedDevilment: boolean = false
	hasDevilment: boolean = false
	timelyDevilment: boolean = false
	poolingProblem: boolean = false

	buffsRemoved: number[] = []
	playersBuffed: string[] = []
	containsOtherDNC: boolean = false

	constructor(start: number) {
		this.start = start
	}
}

export class Technicalities extends Analyser {
	static override handle = 'technicalities'
	static override title = t('dnc.technicalities.title')`Technical Windows`
	static override displayOrder = DISPLAY_ORDER.TECHNICALITIES

	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private gauge!: Gauge
	@dependency private data!: Data

	private history: TechnicalWindow[] = []
	private badDevilments: number = 0

	private technicalFinishIds = TECHNICAL_FINISHES.map(key => this.data.actions[key].id)

	override initialise() {
		const techFinishFilter = filter<Event>().type('statusApply').status(this.data.statuses.TECHNICAL_FINISH.id)

		// Ignore any actors besides players
		const playerCharacters = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)

		// 6.4 changed the status application time from the players own finish to not always happen at the same time as the executing action
		// Hook both the player's finish actions and status applications targeting the player
		this.addEventHook(
			techFinishFilter
				.target(this.parser.actor.id),
			this.tryOpenWindow)
		this.addEventHook(
			filter<Event>().type('action').action(oneOf(this.technicalFinishIds))
				.source(this.parser.actor.id),
			this.tryOpenWindow)

		this.addEventHook(
			techFinishFilter
				.source(this.parser.actor.id)
				.target(oneOf(playerCharacters)),
			this.countTechBuffs)

		this.addEventHook(
			filter<Event>()
				.type('statusRemove')
				.target(this.parser.actor.id)
				.status(oneOf(WINDOW_STATUSES.map(key => this.data.statuses[key].id))),
			this.tryCloseWindow,
		)
		this.addEventHook(filter<Event>().type('action').source(this.parser.actor.id), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private countTechBuffs(event: Events['statusApply']) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		// If it was already open (because another Dancer went first), we'll keep using it
		const lastWindow: TechnicalWindow = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		if (!lastWindow.playersBuffed.includes(event.target) && this.actors.get(event.target).playerControlled) {
			lastWindow.playersBuffed.push(event.target)
		}
	}

	private tryOpenWindow(event: Events['statusApply'] | Events['action']): TechnicalWindow {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		// Handle multiple dancer's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
		// If that happens, re-open the last window and keep tracking
		if (lastWindow != null) {
			if (event.source !== this.parser.actor.id) {
				lastWindow.containsOtherDNC = true
			}
			if (!lastWindow.end) {
				return lastWindow
			}
			if (lastWindow.end === event.timestamp) {
				lastWindow.end = undefined
				return lastWindow
			}
		}

		const newWindow = new TechnicalWindow(event.timestamp)
		this.history.push(newWindow)
		return newWindow
	}

	private tryCloseWindow(event: Events['statusRemove']) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		if (lastWindow == null) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.status)

		if (this.isWindowOkToClose(lastWindow)) {
			lastWindow.end = event.timestamp

			// Check to see if this window could've had more feathers due to possible pooling problems
			if (this.gauge.feathersSpentInRange(lastWindow.start, lastWindow.end) < FEATHER_THRESHHOLD) {
				const previousWindow = this.history[this.history.length-2]
				const feathersBeforeWindow = this.gauge.feathersSpentInRange((previousWindow && previousWindow.end || this.parser.pull.timestamp)
					+ POST_WINDOW_GRACE_PERIOD_MILLIS, lastWindow.start)
				lastWindow.poolingProblem = feathersBeforeWindow > 0
			} else {
				lastWindow.poolingProblem = false
			}
		}
	}

	// Make sure all applicable statuses have fallen off before the window closes
	private isWindowOkToClose(window: TechnicalWindow): boolean {
		if (window.hasDevilment && !window.buffsRemoved.includes(this.data.statuses.DEVILMENT.id)) {
			return false
		}
		if (!window.buffsRemoved.includes(this.data.statuses.TECHNICAL_FINISH.id)) {
			return false
		}
		return true
	}

	private onCast(event: Events['action']) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		if (event.action === this.data.actions.DEVILMENT.id) {
			this.handleDevilment(lastWindow)
		}

		// If we don't have a window, bail
		if (lastWindow == null) {
			return
		}

		const action = this.data.getAction(event.action)

		// Can't do anything else if we didn't get a valid action object
		if (action == null) {
			return
		}

		// If this window isn't done yet add the action to the list
		if (!lastWindow.end) {
			lastWindow.rotation.push(event)
			// Check whether this window has a devilment status from before the window began
			if (!lastWindow.hasDevilment && this.actors.current.hasStatus(this.data.statuses.DEVILMENT.id)) {
				lastWindow.hasDevilment = true
			}
			if (action.onGcd) {
				lastWindow.gcdCount++
			}
			if (this.technicalFinishIds.includes(event.action) || lastWindow.playersBuffed.length < 1) {
				lastWindow.containsOtherDNC = true
			}
			return
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}

	/** Check to see if Devilment was used at the proper time. In Endwalker, it should immediately follow Technical Finish */
	private handleDevilment(lastWindow: TechnicalWindow | undefined) {
		// If we're not currently in an active Technical Window, mark the Devilment use as bad
		if (lastWindow == null || lastWindow.end) {
			this.badDevilments++
			return
		}

		lastWindow.usedDevilment = true

		// If the player hits devilment within a GCD of another DNC's Finish going up, or immediately following their own Technical Finish, it is considered to be on time
		if (lastWindow.gcdCount <= 1 ||
			this.technicalFinishIds.includes(lastWindow.rotation[lastWindow.rotation.length-1].action)) {
			lastWindow.timelyDevilment = true
		}
	}

	private onComplete() {
		// Suggestion to use Devilment under Technical
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.bad-devilments.content">
				Using <DataLink action="DEVILMENT" /> outside of your <DataLink status="TECHNICAL_FINISH" /> windows leads to an avoidable loss in DPS. Aside from certain opener situations, you should be using <DataLink action="DEVILMENT" /> at the beginning of your <DataLink status="TECHNICAL_FINISH" /> windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: this.badDevilments,
			why: <Trans id="dnc.technicalities.suggestions.bad-devilments.why">
				<Plural value={this.badDevilments} one="# Devilment" other="# Devilments"/> used outside <DataLink status="TECHNICAL_FINISH" />.
			</Trans>,
		}))

		// Suggestion to use Devilment ASAP in Technical
		const lateDevilments = this.history.filter(window => window.usedDevilment && !window.timelyDevilment).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-devilments.content">
				Using <DataLink action="DEVILMENT" /> as early as possible during your <DataLink status="TECHNICAL_FINISH" /> windows allows you to maximize the multiplicative bonuses that both statuses give you. It should be used immediately after <DataLink action="TECHNICAL_FINISH" />.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: lateDevilments,
			why: <Trans id="dnc.technicalities.suggestions.late-devilments.why">
				<Plural value={lateDevilments} one="# Devilment was" other="# Devilments were"/> used later than optimal.
			</Trans>,
		}))

		// Suggestion to pool feathers for Technical Windows
		const unpooledWindows = this.history.filter(window => window.poolingProblem).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FAN_DANCE.icon,
			content: <Trans id="dnc.technicalities.suggestions.unpooled.content">
				Pooling your Feathers before going into a <DataLink status="TECHNICAL_FINISH" /> window allows you to use more <DataLink action="FAN_DANCE" />s with the multiplicative bonuses active, increasing their effectiveness. Try to build and hold on to at least three feathers between windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: unpooledWindows,
			why: <Trans id="dnc.technicalities.suggestions.unpooled.why">
				<Plural value={unpooledWindows} one="# window" other="# windows"/> were missing potential <DataLink action="FAN_DANCE" />s.
			</Trans>,
		}))
	}

	override output() {
		const otherDancers = this.history.filter(window => window.containsOtherDNC).length > 0
		return <Fragment>
			{otherDancers && (
				<Message>
					<Trans id="dnc.technicalities.rotation-table.message">
						This log contains <DataLink showIcon={false} action="TECHNICAL_STEP" /> windows that were started or extended by other Dancers.<br />
						Use your best judgement about which windows you should be dumping <DataLink showIcon={false} action="DEVILMENT" />, Feathers, and Esprit under.<br />
						Try to make sure they line up with other raid buffs to maximize damage.
					</Trans>
				</Message>
			)}
			<RotationTable
				notes={[
					{
						header: <Trans id="dnc.technicalities.rotation-table.header.missed"><DataLink showName={false} action="DEVILMENT" /> On Time?</Trans>,
						accessor: 'timely',
					},
					{
						header: <Trans id="dnc.technicalities.rotation-table.header.pooled"><DataLink showName={false} action="FAN_DANCE" /> Pooled?</Trans>,
						accessor: 'pooled',
					},
					{
						header: <Trans id="dnc.technicalities.rotation-table.header.buffed">Players Buffed</Trans>,
						accessor: 'buffed',
					},
				]}
				data={this.history.map(window => {
					return ({
						start: window.start - this.parser.pull.timestamp,
						end: window.end != null ?
							window.end - this.parser.pull.timestamp :
							window.start - this.parser.pull.timestamp,
						notesMap: {
							timely: <>{this.getNotesIcon(!window.timelyDevilment)}</>,
							pooled: <>{this.getNotesIcon(window.poolingProblem)}</>,
							buffed: <>{window.playersBuffed.length > 0 ? window.playersBuffed.length : 'N/A'}</>,
						},
						rotation: window.rotation,
					})
				})}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
	private getNotesIcon(ruleFailed: boolean) {
		return <Icon
			name={ruleFailed ? 'remove' : 'checkmark'}
			className={ruleFailed ? 'text-error' : 'text-success'}
		/>
	}
}
