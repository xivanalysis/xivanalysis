import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BASE_GCDS_PER_WINDOW = 6

class LIGHTSPEED_Window {
	start: number
	end?: number

	rotation: Array<Events['action']> = []
	gcdCount: number = 0
	mpSavings: number = 0
	trailingGcdEvent?: Events['action']

	buffsRemoved: Array<Status['id']> = []
	deathTruncated: boolean = false

	constructor(start: number) {
		this.start = start
	}
}

// in this module we only want to track Lightspeed windows opened by
// the character selected for analysis. windows that clip into
// AST Lightspeed will be marked.
// Used DNC Technicalities as basis for this module. Rewritten from previous module for consistency purposes
export default class Lightspeed extends Analyser {
	static override handle = 'Lightspeed'
	static override title = t('ast.Lightspeed.title')`Lightspeed`
	static override displayOrder = DISPLAY_ORDER.LIGHTSPEED

	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private history: LIGHTSPEED_Window[] = []

	override initialise() {
		const lightspeedFilter = filter<Event>().status(this.data.statuses.LIGHTSPEED.id)

		this.addEventHook(lightspeedFilter.type('statusApply')
			.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(lightspeedFilter.type('statusRemove')
			.target(this.parser.actor.id), this.tryCloseWindow)

		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onCast)
	}

	private tryOpenWindow(event: Events['statusApply']): LIGHTSPEED_Window {
		const lastWindow: LIGHTSPEED_Window | undefined = _.last(this.history)

		// If that happens, re-open the last window and keep tracking
		if (lastWindow != null) {
			if (!lastWindow.end) {
				return lastWindow
			}
			if (lastWindow.end === event.timestamp) {
				lastWindow.end = undefined
				return lastWindow
			}
		}

		const newWindow = new LIGHTSPEED_Window(event.timestamp)
		this.history.push(newWindow)
		return newWindow
	}

	private tryCloseWindow(event: Events['statusRemove']) {
		const lastWindow: LIGHTSPEED_Window | undefined = _.last(this.history)

		if (lastWindow == null) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.status)

		if (this.isWindowOkToClose(lastWindow)) {
			lastWindow.end = event.timestamp
		}
	}

	// Make sure all applicable statuses have fallen off before the window closes
	private isWindowOkToClose(window: LIGHTSPEED_Window): boolean {
		if (!window.buffsRemoved.includes(this.data.statuses.LIGHTSPEED.id)) {
			return false
		}
		return true
	}

	private onCast(event: Events['action']) {
		const lastWindow: LIGHTSPEED_Window | undefined = _.last(this.history)

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
			if (action.onGcd) {
				lastWindow.gcdCount++
			}
			if (this.parser.patch.before('5.3') && action.mpCost != null) {
				lastWindow.mpSavings = lastWindow.mpSavings + action.mpCost/2
			}
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}

	// just output, no suggestions for now.
	override output() {
		const tableData = this.history.map(window => {
			const end = window.end != null ?
				window.end - this.parser.pull.timestamp :
				window.start - this.parser.pull.timestamp
			const start = window.start - this.parser.pull.timestamp
			// how long (or short, really) a window needs to be in order to be considered truncated
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			const LIGHTSPEED_TRUNCATE_DURATION = this.data.statuses.LIGHTSPEED.duration - 2000

			// overlapped if: we detected an overwrite of this player onto another player, or if
			// this player's buff had a duration that was too short and they didn't die
			const overlap =  (!window.deathTruncated && (end !== start) && (end - start < LIGHTSPEED_TRUNCATE_DURATION))

			return ({
				start,
				end,
				overlap,
				notesMap: {
					overlapped: <>{overlap ? <Icon name="x" color="red" /> : <Icon name="check" color="green" />}</>,
					totalSavings: <>{window.mpSavings}</>,
				},
				rotation: window.rotation,
				targetsData: {
					gcds: {
						actual: window.gcdCount,
						expected: (BASE_GCDS_PER_WINDOW),
					},
				},
			})
		})

		const actualCasts = tableData.length
		const totalPossibleCasts = Math.ceil(this.parser.pull.duration / this.data.actions.LIGHTSPEED.cooldown)

		const noCastsMessage = <p><span className="text-error"><Trans id="ast.lightspeed.messages.no-casts"> There were no casts recorded for <DataLink action="LIGHTSPEED" />.</Trans></span></p>
		const castsMessage = <p><Trans id="ast.lightspeed.messages.num-casts"> There were a total of {actualCasts} out of a possible {totalPossibleCasts} <DataLink action="LIGHTSPEED" /> casts noted.</Trans></p>

		const pre5_3message = <p><Trans id="ast.lightspeed.messages.explanation">
		The main use of <DataLink action="LIGHTSPEED" /> should be for weaving card actions during <DataLink action="DIVINATION" /> and <DataLink action="SLEEVE_DRAW" /> windows.<br />
		It can also be used for MP savings on heavy healing segments, keeping casts up while on the move and other specific scenarios.<br />
		Each fight calls for a different strategy, but try to utilize it as much as possible.<br />
		Unless it's being used for <DataLink action="ASCEND" />, lightspeed should fit at least 6 GCDs.<br />
		</Trans></p>

		const message = <p><Trans id="ast.lightspeed.messages.explanation.ost5_3">
		The main use of <DataLink action="LIGHTSPEED" /> should be for weaving card actions during <DataLink action="DIVINATION" /> and <DataLink action="SLEEVE_DRAW" /> windows.<br />
		It can also be used for keeping casts up while on the move and other specific scenarios.<br />
		Each fight calls for a different strategy, but try to utilize it as much as possible.<br />
		Unless it's being used for <DataLink action="ASCEND" />, lightspeed can fit at least 6 GCDs.<br />
		</Trans></p>

		if (this.parser.patch.before('5.3')) {

			return <Fragment>
				{pre5_3message}
				{actualCasts > 0 ? castsMessage : noCastsMessage}
				{actualCasts > 0 ?
					<RotationTable
						notes={[
							{
								header: <Trans id="ast.lightspeed.rotation.mp-saved">MP saved</Trans>,
								accessor: 'totalSavings',
							},
						]}
						targets={[
							{
								header: <Trans id="ast.LIGHTSPEED.rotation-table.header.gcd-count">GCDs</Trans>,
								accessor: 'gcds',
							},
						]}
						data={tableData}
						onGoto={this.timeline.show}
					/>
					: ''}
			</Fragment>
		}

		return <Fragment>
			{message}
			{actualCasts > 0 ? castsMessage : noCastsMessage}
			{actualCasts > 0 ?
				<RotationTable
					targets={[
						{
							header: <Trans id="ast.LIGHTSPEED.rotation-table.header.gcd-count">GCDs</Trans>,
							accessor: 'gcds',
						},
					]}
					data={tableData}
					onGoto={this.timeline.show}
				/>
				: ''}
		</Fragment>
	}
}
