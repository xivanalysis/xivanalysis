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
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BL_GCD_TARGET = 8
const WINDOW_STATUSES = [
	STATUSES.BATTLE_LITANY.id,
]

class BLWindow {
	start: number
	end?: number

	rotation: Array<NormalisedApplyBuffEvent | CastEvent> = []
	gcdCount: number = 0
	trailingGcdEvent?: CastEvent

	buffsRemoved: number[] = []
	playersBuffed: number = 0
	containsOtherDRG: boolean = false

	constructor(start: number) {
		this.start = start
	}
}

export default class BattleLitany extends Module {
	static handle = 'battlelitany'
	static title = t('drg.battlelitany.title')`Battle Litany`
	// hmm yeah drg should sort modules properly at some point
	static displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private history: BLWindow[] = []

	protected init() {
		this.addEventHook('normalisedapplybuff', {to: 'player', abilityId: STATUSES.BATTLE_LITANY.id}, this.tryOpenWindow)
		this.addEventHook('normalisedapplybuff', {by: 'player', abilityId: STATUSES.BATTLE_LITANY.id}, this.countLitBuffs)
		this.addEventHook('removebuff', {to: 'player', abilityId: WINDOW_STATUSES}, this.tryCloseWindow)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private countLitBuffs(event: NormalisedApplyBuffEvent) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		// If it was already open (because another Dancer went first), we'll keep using it
		const lastWindow: BLWindow | undefined = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		// BL has two normalized windows? seems weird...
		lastWindow.playersBuffed += event.confirmedEvents.filter(hit => this.parser.fightFriendlies.findIndex(f => f.id === hit.targetID) >= 0).length
	}

	private tryOpenWindow(event: NormalisedApplyBuffEvent): BLWindow {
		const lastWindow: BLWindow | undefined = _.last(this.history)

		// Handle multiple drg's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
		// If that happens, re-open the last window and keep tracking
		if (lastWindow) {
			if (event.sourceID && event.sourceID !== this.parser.player.id) {
				lastWindow.containsOtherDRG = true
			}
			if (!lastWindow.end) {
				return lastWindow
			}
			if (lastWindow.end === event.timestamp) {
				lastWindow.end = undefined
				return lastWindow
			}
		}

		const newWindow = new BLWindow(event.timestamp)
		this.history.push(newWindow)
		return newWindow
	}

	private tryCloseWindow(event: BuffEvent) {
		const lastWindow: BLWindow | undefined = _.last(this.history)

		if (!lastWindow) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.ability.guid)

		if (this.isWindowOkToClose(lastWindow)) {
			lastWindow.end = event.timestamp
		}
	}

	// Make sure all applicable statuses have fallen off before the window closes
	private isWindowOkToClose(window: BLWindow): boolean {
		if (!window.buffsRemoved.includes(STATUSES.BATTLE_LITANY.id)) {
			return false
		}
		return true
	}

	private onCast(event: CastEvent) {
		const lastWindow: BLWindow | undefined = _.last(this.history)

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

			if (action.onGcd) {
				lastWindow.gcdCount++
			}
			if (lastWindow.playersBuffed < 1) {
				lastWindow.containsOtherDRG = true
			}
			return
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}

	private onComplete() {
		// drg suggestions tbd
	}

	output() {
		const otherDRG = this.history.filter(window => window.containsOtherDRG).length > 0
		return <Fragment>
			{otherDRG && (
				<Message>
					<Trans id="drg.battlelitany.rotation-table.message">
						This log contains <ActionLink showIcon={false} {...ACTIONS.BATTLE_LITANY}/> windows that were started or extended by other Dragoons. Try to make sure they do not overlap in order to maximize damage.
					</Trans>
				</Message>
			)}
			<RotationTable
				targets={[
					{
						header: <Trans id="drg.battlelitany.rotation-table.header.gcd-count">GCDs</Trans>,
						accessor: 'gcds',
					},
				]}
				notes={[
					{
						header: <Trans id="drg.battlelitany.rotation-table.header.buffed">Players Buffed</Trans>,
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
								buffed: <>{window.playersBuffed ? window.playersBuffed : 'N/A'}</>,
							},
						rotation: window.rotation,
						targetsData: {
							gcds: {
								actual: window.gcdCount,
								expected: BL_GCD_TARGET,
							},
						},
					})
				})}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
}
