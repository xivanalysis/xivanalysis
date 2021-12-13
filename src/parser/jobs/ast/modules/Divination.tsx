import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BASE_GCDS_PER_WINDOW = 6
const PLAYERS_BUFFED_TARGET = 8

interface DIVINATION_Window {
	start: number
	end?: number
	source: Actor['id']

	rotation: Array<Events['action']>
	gcdCount: number
	trailingGcdEvent?: Events['action']
	playersBuffed: Array<Actor['id']>
	overlap: boolean
}

// in this module we only want to track Divination windows opened by
// the character selected for analysis. windows that clip into
// AST Divination will be marked.
// Used DNC Technicalities as basis for this module. Rewritten from previous module for consistency purposes
export default class Divination extends Analyser {
	static override handle = 'Divination'
	static override title = t('ast.divination.title')`Divination`
	static override displayOrder = DISPLAY_ORDER.DIVINATION

	@dependency private timeline!: Timeline
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

	private history: DIVINATION_Window[] = []
	private currentWindow: DIVINATION_Window | undefined = undefined
	private castHook?: EventHook<Events['action']>

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

		this.addEventHook(divinationFilter.source(this.parser.actor.id), this.countDivinationBuffs)
		this.addEventHook(divinationFilter.type('statusApply')
			.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(divinationFilter.type('statusRemove')
			.target(this.parser.actor.id), this.tryCloseWindow)

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
			//if window was open. close it prematurely :(
			if (this.currentWindow != null) {
				const eventClose: Events['statusRemove'] = {
					timestamp: event.timestamp,
					status: this.data.statuses.DIVINATION.id,
					type: 'statusRemove',
					source: event.source,
					target: this.parser.actor.id,
				}
				this.tryCloseWindow(eventClose)
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
			}
			this.castHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action'),
				this.onCast,
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

		//to stop using function if window isn't even open. used when splicing
		if (this.currentWindow == null) {
			return
		}

		//close window and push to history
		if (event.source === this.parser.actor.id) {
			this.currentWindow.end = event.timestamp
			this.history.push(this.currentWindow)
			this.currentWindow = undefined
			if (this.castHook != null) {
				this.removeEventHook(this.castHook)
				this.castHook = undefined
			}
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
					About {this.otherAst.countOverwritten} <Plural value={this.otherAst.countOverwritten} one="cast" other="casts" /> of <DataLink action="DIVINATION" /> were overwritten resulting in a loss of at least {this.parser.formatDuration(this.otherAst.timeOverwritten)}.
				</Trans>,
			}))
		}
	}

	// just output, no suggestions for now.
	override output() {

		//in the case when the encounter ends prior to status remove. splicing the event to log it. note: since close event checks for null, this will not be applicable if the window isn't already open
		const eventClose: Events['statusRemove'] = {
			timestamp: this.parser.pull.duration,
			status: this.data.statuses.DIVINATION.id,
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
				},
				notesMap: {
					otherAst: <>{this.getNotesIcon(window.overlap)}</>,
				},
			})
		})

		const actualCasts = tableData.length
		const noCastsMessage = <p><span className="text-error"><Trans id="ast.divination.messages.no-casts"> There were no casts recorded for <DataLink action="DIVINATION" />.</Trans></span></p>

		//for now, the message is copied directly from DivinationDowntime
		const message = <p><Trans id="ast.ogcd-downtime.divination.description">
			<DataLink action="DIVINATION" /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
			Damage percentage bonuses stack multiplicatively, so it's most optimal to stack it with cards from <DataLink action="DRAW" /> and an Astrologian's <DataLink action="ASTRODYNE" /> when 3 unique seals are obtained. <br/>
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it.
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
					]}
					notes = {[
						{
							header: <Trans id="ast.divination.rotation-table.header.overwrite">Overwrote other AST</Trans>,
							accessor: 'otherAst',
						},
					]}
					data={tableData}
					onGoto={this.timeline.show}
				/>}
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
					]}
					data={tableData}
					onGoto={this.timeline.show}
				/>
				: ''}
		</Fragment>
	}

	private getNotesIcon(ruleFailed: boolean) {
		return ruleFailed ? <Icon
			name={'remove'}
			className={'text-error'}
		/>
			: ''
	}
}
