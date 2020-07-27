import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import _ from 'lodash'
import React, {Fragment} from 'react'
import {Message, Icon} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'

import Module, {dependency} from 'parser/core/Module'
import {NormalisedApplyBuffEvent} from 'parser/core/modules/NormalisedEvents'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BL_GCD_TARGET = 8
const WINDOW_STATUSES = [
	STATUSES.BATTLE_LITANY.id,
]

// how long (or short, really) a window needs to be in order to be considered truncated
// tslint:disable-next-line:no-magic-numbers
const BL_TRUNCATE_DURATION = (STATUSES.BATTLE_LITANY.duration * 1000) - 2000

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


// in this module we only want to track battle litany windows opened by
// the character selected for analysis. windows that clip into or overwrite other
// DRG litanies will be marked.
// Used DNC technical step as basis for this module.
export default class BattleLitany extends Module {
	static handle = 'battlelitany'
	static title = t('drg.battlelitany.title')`Battle Litany`
	static displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private history: BLWindow[] = []
	private lastLitFalloffTime: number = 0

	protected init() {
		this.addEventHook('normalisedapplybuff', {to: 'player', abilityId: STATUSES.BATTLE_LITANY.id}, this.tryOpenWindow)
		this.addEventHook('normalisedapplybuff', {by: 'player', abilityId: STATUSES.BATTLE_LITANY.id}, this.countLitBuffs)
		this.addEventHook('removebuff', {to: 'player', abilityId: WINDOW_STATUSES}, this.tryCloseWindow)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
	}

	private countLitBuffs(event: NormalisedApplyBuffEvent) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		const lastWindow: BLWindow | undefined = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		// BL has two normalized windows? seems weird...
		if (lastWindow) {
			lastWindow.playersBuffed += event.confirmedEvents.filter(hit => this.parser.fightFriendlies.findIndex(f => f.id === hit.targetID) >= 0).length
		}
	}

	private tryOpenWindow(event: NormalisedApplyBuffEvent): BLWindow | undefined {
		const lastWindow: BLWindow | undefined = _.last(this.history)


		if (lastWindow && !lastWindow.end) {
			return lastWindow
		}

		if (event.sourceID && event.sourceID === this.parser.player.id) {
			const newWindow = new BLWindow(event.timestamp)

			// Handle multiple drg's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
			// If that happens, mark the window and return
			newWindow.containsOtherDRG = this.lastLitFalloffTime === event.timestamp

			this.history.push(newWindow)
			return newWindow
		}

		return undefined
	}

	private tryCloseWindow(event: BuffEvent) {
		// for determining overwrite, cache the status falloff time
		this.lastLitFalloffTime = event.timestamp

		// only track the things one player added
		if (event.sourceID && event.sourceID !== this.parser.player.id)
			return

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

		const action = this.data.getAction(event.ability.guid)

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

	// just output, no suggestions for now.
	// open to maybe putting a suggestion not to clip into other DRG windows? hitting everyone with litany?
	output() {
		const tableData = this.history.map(window => {
			const end = window.end != null ?
				window.end - this.parser.fight.start_time :
				window.start - this.parser.fight.start_time
			const start = window.start - this.parser.fight.start_time
			const overlap = window.containsOtherDRG || ((end !== start) && (end - start < BL_TRUNCATE_DURATION))

			return ({
				start,
				end,
				overlap,
				notesMap: {
					overlapped: <>{overlap ? <Icon name="x" color="red" /> : <Icon name="check" color="green" />}</>,
				},
				rotation: window.rotation,
				targetsData: {
					gcds: {
						actual: window.gcdCount,
						expected: BL_GCD_TARGET,
					},
					buffed: {
						actual: window.playersBuffed,
						expected: 8,
					},
				},
			})
		})

		const notes = []
		const overlap = tableData.filter(window => window.overlap).length > 0

		if (overlap) {
			notes.push({
				header: <Trans id="drg.battlelitany.rotation-table.header.interfered">No Overlap</Trans>,
				accessor: 'overlapped',
			})
		}

		return <Fragment>
			{overlap && (
				<Message warning>
					<Trans id="drg.battlelitany.rotation-table.message">
						This log contains <ActionLink {...ACTIONS.BATTLE_LITANY}/> windows that interfered with windows
						started by other Dragoons. Try to make sure that casts of <ActionLink showIcon={false} {...ACTIONS.BATTLE_LITANY} /> do
						not overlap in order to maximize damage.
					</Trans>
				</Message>
			)}
			<RotationTable
				targets={[
					{
						header: <Trans id="drg.battlelitany.rotation-table.header.gcd-count">GCDs</Trans>,
						accessor: 'gcds',
					},
					{
						header: <Trans id="drg.battlelitany.rotation-table.header.buffed">Players Buffed</Trans>,
						accessor: 'buffed',
					},
				]}
				notes={notes}
				data={tableData}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
}
