import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import _ from 'lodash'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {NormalisedApplyBuffEvent} from 'parser/core/modules/NormalisedEvents'

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


// in this module we only want to track battle litany windows opened by
// the character selected for analysis. windows that clip into or overwrite other
// DRG litanies will be marked.
// Used DNC technical step as basis for this module.
export default class BattleLitany extends Module {
	static handle = 'battlelitany'
	static title = t('drg.battlelitany.title')`Battle Litany`
	static displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private timeline!: Timeline

	private history: BLWindow[] = []

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

		// Handle multiple drg's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
		// If that happens, mark the other window and return
		if (lastWindow) {
			if (event.sourceID && event.sourceID !== this.parser.player.id) {
				lastWindow.containsOtherDRG = !!(lastWindow.end && (event.timestamp < lastWindow.end))
				return undefined
			}
			if (!lastWindow.end) {
				return lastWindow
			}
		}

		if (event.sourceID && event.sourceID === this.parser.player.id) {
			const newWindow = new BLWindow(event.timestamp)
			this.history.push(newWindow)
			return newWindow
		}

		return undefined
	}

	private tryCloseWindow(event: BuffEvent) {
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

	// just output, no suggestions for now.
	// open to maybe putting a suggestion not to clip into other DRG windows? hitting everyone with litany?
	output() {
		const tableData = this.history.map(window => {
			const end = window.end != null ?
				window.end - this.parser.fight.start_time :
				window.start - this.parser.fight.start_time
			const start = window.start - this.parser.fight.start_time
			const overlap = window.containsOtherDRG || ((end !== start) && (end - start < (STATUSES.BATTLE_LITANY.duration * 1000 - 2000)))

			return ({
				start,
				end,
				overlap,
				notesMap: {
					buffed: <>{window.playersBuffed ? window.playersBuffed : 'N/A'}</>,
					overlapped: <>{overlap ? 'Yes' : 'No'}</>,
				},
				rotation: window.rotation,
				targetsData: {
					gcds: {
						actual: window.gcdCount,
						expected: BL_GCD_TARGET,
					},
				},
			})
		})

		const notes = [
			{
				header: <Trans id="drg.battlelitany.rotation-table.header.buffed">Players Buffed</Trans>,
				accessor: 'buffed',
			},
		]
		const overlap = tableData.filter(window => window.overlap).length > 0

		if (overlap) {
			notes.push({
				header: <Trans id="drg.battlelitany.rotation-table.header.interfered">Overlapped?</Trans>,
				accessor: 'overlapped',
			})
		}

		return <Fragment>
			{overlap && (
				<Message warning>
					<Trans id="drg.battlelitany.rotation-table.message">
						This log contains <ActionLink {...ACTIONS.BATTLE_LITANY}/> windows that interfered with windows
						started by other Dragoons. Try to make sure that casts of <ActionLink showIcon={false} {...ACTIONS.BATTLE_LITANY} />
						do not overlap in order to maximize damage.
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
				notes={notes}
				data={tableData}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
}
