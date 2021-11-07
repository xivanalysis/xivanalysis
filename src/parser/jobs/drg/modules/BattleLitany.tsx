import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Message, Icon} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BL_GCD_TARGET = 8

// how long (or short, really) a window needs to be in order to be considered truncated
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const BL_TRUNCATE_DURATION = STATUSES.BATTLE_LITANY.duration - 2000

class BLWindow {
	start: number
	end?: number

	rotation: Array<Events['action']> = []
	gcdCount: number = 0
	trailingGcdEvent?: Events['action']

	buffsRemoved: number[] = []
	playersBuffed: string[] = []
	containsOtherDRG: boolean = false
	deathTruncated: boolean = false

	constructor(start: number) {
		this.start = start
	}
}

// Analyser port note:
// - hoping to use new BuffWindow module to handle this logic
// in this module we only want to track battle litany windows opened by
// the character selected for analysis. windows that clip into or overwrite other
// DRG litanies will be marked.
// Used DNC technical step as basis for this module.
export default class BattleLitany extends Analyser {
	static override handle = 'battlelitany'
	static override title = t('drg.battlelitany.title')`Battle Litany`
	static override displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private actors!: Actors
	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private history: BLWindow[] = []
	private lastLitFalloffTime: number = 0

	override initialise() {
		const battleLitFilter = filter<Event>().type('statusApply').status(this.data.statuses.BATTLE_LITANY.id)
		this.addEventHook(battleLitFilter.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(battleLitFilter.source(this.parser.actor.id), this.countLitBuffs)
		this.addEventHook(
			filter<Event>()
				.type('statusRemove')
				.target(this.parser.actor.id)
				.status(this.data.statuses.BATTLE_LITANY.id),
			this.tryCloseWindow
		)
		this.addEventHook(filter<Event>().type('action').source(this.parser.actor.id), this.onCast)
		this.addEventHook(filter<Event>().type('death').actor(this.parser.actor.id), this.onDeath)
	}

	// protected override init() {
	// 	this.addEventHook('normalisedapplybuff', {to: 'player', abilityId: STATUSES.BATTLE_LITANY.id}, this.tryOpenWindow)
	// 	this.addEventHook('normalisedapplybuff', {by: 'player', abilityId: STATUSES.BATTLE_LITANY.id}, this.countLitBuffs)
	// 	this.addEventHook('removebuff', {to: 'player', abilityId: WINDOW_STATUSES}, this.tryCloseWindow)
	// 	this.addEventHook('death', {to: 'player'}, this.onDeath)
	// 	this.addEventHook('cast', {by: 'player'}, this.onCast)
	// }

	private countLitBuffs(event: Events['statusApply']) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		const lastWindow: BLWindow | undefined = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		// BL has two normalized windows? seems weird...
		if (lastWindow && !lastWindow.playersBuffed.includes(event.target) && this.actors.get(event.target).playerControlled) {
			lastWindow.playersBuffed.push(event.target)
		}
	}

	private tryOpenWindow(event: Events['statusApply']): BLWindow | undefined {
		const lastWindow: BLWindow | undefined = _.last(this.history)

		if (lastWindow && !lastWindow.end) {
			return lastWindow
		}

		if (event.source === this.parser.actor.id) {
			const newWindow = new BLWindow(event.timestamp)

			// Handle multiple drg's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
			// If that happens, mark the window and return
			newWindow.containsOtherDRG = this.lastLitFalloffTime === event.timestamp

			this.history.push(newWindow)
			return newWindow
		}

		return undefined
	}

	private tryCloseWindow(event: Events['statusRemove']) {
		// for determining overwrite, cache the status falloff time
		this.lastLitFalloffTime = event.timestamp

		// only track the things one player added
		if (event.source !== this.parser.actor.id) { return }

		const lastWindow: BLWindow | undefined = _.last(this.history)

		if (!lastWindow) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.status)

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

	private onCast(event: Events['action']) {
		const lastWindow: BLWindow | undefined = _.last(this.history)

		// If we don't have a window, bail
		if (!lastWindow) {
			return
		}

		const action = this.data.getAction(event.action)

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
			return
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}

	private onDeath(event: Events['death']) {
		// end the window and set a flag to not count as overlapping if times are different
		const lastWindow: BLWindow | undefined = _.last(this.history)

		if (!lastWindow) {
			return
		}

		// if there was a death within an expected window duration, we can assume the player died while
		// lit was active.
		if (event.timestamp < lastWindow.start + STATUSES.BATTLE_LITANY.duration) {
			lastWindow.deathTruncated = true
		}
	}

	// just output, no suggestions for now.
	// open to maybe putting a suggestion not to clip into other DRG windows? hitting everyone with litany?
	override output() {
		const tableData = this.history.map(window => {
			const start = window.start - this.parser.pull.timestamp
			const end = window.end != null ?
				window.end - this.parser.pull.timestamp :
				start

			// overlapped if: we detected an overwrite of this player onto another player, or if
			// this player's buff had a duration that was too short and they didn't die
			const overlap = window.containsOtherDRG || (!window.deathTruncated && (end !== start) && (end - start < BL_TRUNCATE_DURATION))

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
						actual: window.playersBuffed.length,
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
