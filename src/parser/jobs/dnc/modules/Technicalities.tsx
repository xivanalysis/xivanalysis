import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {NormalisedApplyBuffEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

import {Timeline} from 'parser/core/modules/Timeline'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import FeatherGauge from './FeatherGauge'
import {TECHNICAL_FINISHES} from '../CommonData'

// Harsher than the default since you'll only have 4-5 total windows anyways
const TECHNICAL_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const WINDOW_STATUSES = [
	STATUSES.DEVILMENT.id,
	STATUSES.TECHNICAL_FINISH.id,
]

const FEATHER_THRESHHOLD = 3
const POST_WINDOW_GRACE_PERIOD_MILLIS = 500
const DEVILMENT_COOLDOWN_MILLIS = ACTIONS.DEVILMENT.cooldown * 1000

class TechnicalWindow {
	start: number
	end?: number

	rotation: Array<NormalisedApplyBuffEvent | CastEvent> = []
	gcdCount: number = 0
	trailingGcdEvent?: CastEvent

	usedDevilment: boolean = false
	hasDevilment: boolean = false
	timelyDevilment: boolean = false
	poolingProblem: boolean = false

	buffsRemoved: number[] = []
	playersBuffed: number = 0
	containsOtherDNC: boolean = false

	constructor(start: number) {
		this.start = start
	}
}

export default class Technicalities extends Module {
	static handle = 'technicalities'
	static title = t('dnc.technicalities.title')`Technical Windows`
	static displayOrder = DISPLAY_ORDER.TECHNICALITIES

	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private feathers!: FeatherGauge

	private history: TechnicalWindow[] = []
	private badDevilments: number = 0
	private lastDevilmentTimestamp: number = -1

	protected init() {
		this.addEventHook('normalisedapplybuff', {to: 'player', abilityId: STATUSES.TECHNICAL_FINISH.id}, this.tryOpenWindow)
		this.addEventHook('normalisedapplybuff', {by: 'player', abilityId: STATUSES.TECHNICAL_FINISH.id}, this.countTechBuffs)
		this.addEventHook('removebuff', {to: 'player', abilityId: WINDOW_STATUSES}, this.tryCloseWindow)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private countTechBuffs(event: NormalisedApplyBuffEvent) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		// If it was already open (because another Dancer went first), we'll keep using it
		const lastWindow: TechnicalWindow | undefined = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		if (!lastWindow.playersBuffed) {
			lastWindow.playersBuffed = event.confirmedEvents.filter(hit => this.parser.fightFriendlies.findIndex(f => f.id === hit.targetID) >= 0).length
		}
	}

	private tryOpenWindow(event: NormalisedApplyBuffEvent): TechnicalWindow {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		// Handle multiple dancer's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
		// If that happens, re-open the last window and keep tracking
		if (lastWindow) {
			if (event.sourceID && event.sourceID !== this.parser.player.id) {
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

	private tryCloseWindow(event: BuffEvent) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		if (!lastWindow) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.ability.guid)

		if (this.isWindowOkToClose(lastWindow)) {
			lastWindow.end = event.timestamp

			// Check to see if this window could've had more feathers due to possible pooling problems
			if (this.feathers.feathersSpentInRange(lastWindow.start, lastWindow.end) < FEATHER_THRESHHOLD) {
				const previousWindow = this.history[this.history.length-2]
				const feathersBeforeWindow = this.feathers.feathersSpentInRange((previousWindow && previousWindow.end || this.parser.fight.start_time)
					+ POST_WINDOW_GRACE_PERIOD_MILLIS, lastWindow.start)
				lastWindow.poolingProblem = feathersBeforeWindow > 0
			}
			else {
				lastWindow.poolingProblem = false
			}

			// If this is the first window, and we didn't catch a devilment use in the window, but we *have* used it,
			// treat it as a timely usage due to party composition
			if (this.history.length === 1 && !lastWindow.usedDevilment && this.lastDevilmentTimestamp > 0) {
				lastWindow.timelyDevilment = true
			}
		}
	}

	// Make sure all applicable statuses have fallen off before the window closes
	private isWindowOkToClose(window: TechnicalWindow): boolean {
		if (window.hasDevilment && !window.buffsRemoved.includes(STATUSES.DEVILMENT.id)) {
			return false
		}
		if (!window.buffsRemoved.includes(STATUSES.TECHNICAL_FINISH.id)) {
			return false
		}
		return true
	}

	private onCast(event: CastEvent) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		if (event.ability.guid === ACTIONS.DEVILMENT.id) {
			this.handleDevilment(lastWindow)
		}

		// If we don't have a window, bail
		if (!lastWindow) {
			return
		}

		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO

		// Can't do anything else if we didn't get a valid action object
		if (!action) {
			return
		}

		// If this window isn't done yet add the action to the list
		if (!lastWindow.end) {
			lastWindow.rotation.push(event)
			// Check whether this window has a devilment status from before the window began
			if (!lastWindow.hasDevilment && this.combatants.selected.hasStatus(STATUSES.DEVILMENT.id)) {
				lastWindow.hasDevilment = true
			}
			if (action.onGcd) {
				lastWindow.gcdCount++
			}
			if (TECHNICAL_FINISHES.includes(event.ability.guid) || lastWindow.playersBuffed < 1) {
				lastWindow.containsOtherDNC = true
			}
			return
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}

	private handleDevilment(lastWindow: TechnicalWindow | undefined) {
		// Don't ding if this is the first Devilment, depending on which job the Dancer is partnered with, it may
		// be appropriate to use Devilment early. In all other cases, Devilment should be used during Technical Finish
		if (!this.combatants.selected.hasStatus(STATUSES.TECHNICAL_FINISH.id) && (this.lastDevilmentTimestamp < 0 ||
			// If the first use we detect is after the cooldown, assume they popped it pre-pull and this 'first'
			// Use is actually also bad
			this.parser.currentTimestamp >= DEVILMENT_COOLDOWN_MILLIS)) {
			this.badDevilments++
		}

		this.lastDevilmentTimestamp = this.parser.currentTimestamp

		// If we don't have a window for some reason, bail
		if (!lastWindow || lastWindow.end) {
			return
		}

		lastWindow.usedDevilment = true

		// Note if the Devilment was used after the second GCD
		if (lastWindow.gcdCount <= 1) {
			lastWindow.timelyDevilment = true
		}
	}

	private onComplete() {
		// Suggestion to use Devilment under Technical
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.bad-devilments.content">
				Using <ActionLink {...ACTIONS.DEVILMENT} /> outside of your <StatusLink {...STATUSES.TECHNICAL_FINISH} /> windows leads to an avoidable loss in DPS. Aside from certain opener situations, you should be using <ActionLink {...ACTIONS.DEVILMENT} /> at the beginning of your <StatusLink {...STATUSES.TECHNICAL_FINISH} /> windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: this.badDevilments,
			why: <Trans id="dnc.technicalities.suggestions.bad-devilments.why">
				<Plural value={this.badDevilments} one="# Devilment" other="# Devilments"/> used outside <StatusLink {...STATUSES.TECHNICAL_FINISH} />.
			</Trans>,
		}))

		// Suggestion to use Devilment ASAP in Technical
		const lateDevilments = this.history.filter(window => window.usedDevilment && !window.timelyDevilment).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-devilments.content">
				Using <ActionLink {...ACTIONS.DEVILMENT} /> as early as possible during your <StatusLink {...STATUSES.TECHNICAL_FINISH} /> windows allows you to maximize the multiplicative bonuses that both statuses give you. Try to use it within the first two GCDs of your window.
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
			icon: ACTIONS.FAN_DANCE.icon,
			content: <Trans id="dnc.technicalities.suggestions.unpooled.content">
				Pooling your Feathers before going into a <StatusLink {...STATUSES.TECHNICAL_FINISH} /> window allows you to use more <ActionLink {...ACTIONS.FAN_DANCE} />s with the multiplicative bonuses active, increasing their effectiveness. Try to build and hold on to at least three feathers between windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: unpooledWindows,
			why: <Trans id="dnc.technicalities.suggestions.unpooled.why">
				<Plural value={unpooledWindows} one="# window" other="# windows"/> were missing potential <ActionLink {...ACTIONS.FAN_DANCE} />s.
			</Trans>,
		}))
	}

	output() {
		const otherDancers = this.history.filter(window => window.containsOtherDNC).length > 0
		return <Fragment>
			{otherDancers && (
				<Message>
					<Trans id="dnc.technicalities.rotation-table.message">
						This log contains <ActionLink showIcon={false} {...ACTIONS.TECHNICAL_STEP}/> windows that were started or extended by other Dancers.<br />
						Use your best judgement about which windows you should be dumping <ActionLink showIcon={false} {...ACTIONS.DEVILMENT}/>, Feathers, and Esprit under.<br />
						Try to make sure they line up with other raid buffs to maximize damage.
					</Trans>
				</Message>
			)}
			<RotationTable
				notes={[
					{
						header: <Trans id="dnc.technicalities.rotation-table.header.missed"><ActionLink showName={false} {...ACTIONS.DEVILMENT}/> On Time?</Trans>,
						accessor: 'timely',
					},
					{
						header: <Trans id="dnc.technicalities.rotation-table.header.pooled"><ActionLink showName={false} {...ACTIONS.FAN_DANCE}/> Pooled?</Trans>,
						accessor: 'pooled',
					},
					{
						header: <Trans id="dnc.technicalities.rotation-table.header.buffed">Players Buffed</Trans>,
						accessor: 'buffed',
					},
				]}
				data={this.history.map(window => {
					return ({
						start: window.start - this.parser.fight.start_time,
						end: window.end != null ?
							window.end - this.parser.fight.start_time :
							window.start - this.parser.fight.start_time,
							notesMap: {
								timely: <>{this.getNotesIcon(!window.timelyDevilment)}</>,
								pooled: <>{this.getNotesIcon(window.poolingProblem)}</>,
								buffed: <>{window.playersBuffed ? window.playersBuffed : 'N/A'}</>,
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
