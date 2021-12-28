import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BASE_GCDS_PER_WINDOW = 6

interface LightspeedWindow {
	start: number
	end?: number

	rotation: Array<Events['action']>
	gcdCount: number
	mpSavings: number
	trailingGcdEvent?: Events['action']

	deathTruncated: boolean
}

// in this module we only want to track Lightspeed windows opened by
// the character selected for analysis. windows that clip into
// AST Lightspeed will be marked.
// Used DNC Technicalities as basis for this module. Rewritten from previous module for consistency purposes
export class Lightspeed extends Analyser {
	static override handle = 'Lightspeed'
	static override title = t('ast.lightspeed.title')`Lightspeed`
	static override displayOrder = DISPLAY_ORDER.LIGHTSPEED

	@dependency private timeline!: Timeline
	@dependency private data!: Data

	private history: LightspeedWindow[] = []
	private currentWindow: LightspeedWindow | undefined = undefined
	private castHook?: EventHook<Events['action']>

	override initialise() {
		const lightspeedFilter = filter<Event>().status(this.data.statuses.LIGHTSPEED.id)

		this.addEventHook(lightspeedFilter.type('statusApply')
			.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(lightspeedFilter.type('statusRemove')
			.target(this.parser.actor.id), this.tryCloseWindow)

		//this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onCast)
	}

	private tryOpenWindow(event: Events['statusApply']) {
		if (this.currentWindow === undefined) {
			this.currentWindow = {
				start: event.timestamp,
				rotation: [],
				gcdCount: 0,
				mpSavings: 0,

				deathTruncated: false,

			}
			this.castHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action'),
				this.onCast,
			)
		}
	}

	private tryCloseWindow(event: Events['statusRemove']) {

		if (this.currentWindow == null) {
			return
		}

		// Make sure all applicable statuses have fallen off before the window closes
		this.currentWindow.end = event.timestamp
		this.history.push(this.currentWindow)
		this.currentWindow = undefined
		if (this.castHook != null) {
			this.removeEventHook(this.castHook)
			this.castHook = undefined

		}
	}

	private onCast(event: Events['action']) {

		// If we don't have a window, bail
		if (this.currentWindow == null) {
			return
		}

		const action = this.data.getAction(event.action)

		// Can't do anything else if we didn't get a valid action object
		if (action == null) {
			return
		}

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

	// just output, no suggestions for now.
	override output() {

		//in the case when the encounter ends prior to status remove. splicing the event to log it. note: since close event checks for null, this will not be applicable if the window isn't already open
		const eventClose: Events['statusRemove'] = {
			timestamp: this.parser.pull.duration,
			status: this.data.statuses.LIGHTSPEED.id,
			type: 'statusRemove',
			source: this.parser.actor.id,
			target: this.parser.actor.id,
		}
		this.tryCloseWindow(eventClose)

		const tableData = this.history.map(window => {
			const end = window.end != null ?
				window.end - this.parser.pull.timestamp :
				this.parser.pull.duration
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

		const message = <p><Trans id="ast.lightspeed.messages.explanation">
		The main use of <DataLink action="LIGHTSPEED" /> should be for weaving card actions during <DataLink action="DIVINATION" /> and <DataLink action="ASTRODYNE" /> windows.<br />
		It can also be used for keeping casts up while on the move and other specific scenarios.<br />
		Each fight calls for a different strategy, but consider utilizing it as much as possible.<br />
		Unless it's being used for <DataLink action="ASCEND" />, lightspeed can fit at least 6 GCDs.<br />
		</Trans></p>

		return <Fragment>
			{message}
			<Message>{actualCasts > 0 ? castsMessage : noCastsMessage}</Message>
			{actualCasts > 0 ?
				<RotationTable
					targets={[
						{
							header: <Trans id="ast.lightspeed.rotation-table.header.gcd-count">GCDs</Trans>,
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
