import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Table, Button, Message} from 'semantic-ui-react'
import {EventHook} from '../Dispatcher'
import {Data} from './Data'
import DISPLAY_ORDER from './DISPLAY_ORDER'

//value to be added to the gcd to avoid false positives. 100ms for caster tax, 50ms for gcd jitter.
const GCD_JITTER_OFFSET = 50
const GCD_CASTER_TAX_OFFSET = 100

const BASE_RECAST = 2500
const OGCD_OFFSET = 1000

interface Window {
	start: number,
	startAction: Events['action'],
	stop?: number,
	stopAction?: Events['action'],
	recastTime: number,
	doNothingForegivness: number, //allowances based on time dead, interruptions, oGCDs
	casterTax: number,
	deathCount?: number,
	interruptedActions?: Action[],
	actions: Array<Events['action']>, //used to track oGCDs for weaves
}

export class ABCTable extends Analyser {
	static override handle = 'alwaysbecastingtable'
	static override title = t('core.always-be-casting-table.title')`ABC Violations`
	static override displayOrder = DISPLAY_ORDER.ABC_TABLE

	@dependency private timeline!: Timeline
	@dependency protected gcd!: GlobalCooldown
	@dependency protected downtime!: Downtime
	@dependency protected data!: Data

	private noCastWindows: {current?: Window, history: Window[]} = {
		history: [],
	}
	private hardCastStartTime: number | undefined = undefined
	private aliveHook: EventHook<Events['statusRemove']> | undefined = undefined
	private timeOfDeath: number | undefined = undefined
	private prepareTime: number = this.parser.pull.timestamp //used for interrupts

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('prepare'), this.onBegin)
		this.addEventHook(playerFilter.type('action'), this.onCast)
		this.addEventHook(playerFilter.type('interrupt'), this.onInterrupt)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onBegin(event: Events['prepare']) {
		//don't want oGCDs resetting the window
		const action: Action | undefined = this.data.getAction(event.action)
		const actionIsOGCD: boolean = !this.data.getAction(event.action)?.onGcd ?? false
		if (action === undefined || actionIsOGCD) { return }
		//use this timestamp for interrupted actions
		this.prepareTime = event.timestamp
		//if coming from a hard cast, use this timestamp instead
		this.hardCastStartTime = event.timestamp
	}

	private onCast(event: Events['action']) {
		const action: Action | undefined = this.data.getAction(event.action)
		if (action === undefined) { return }

		//if an oGCD, just add it to our list of actions
		const actionIsOGCD: boolean = !action?.onGcd ?? false
		if (actionIsOGCD && this.noCastWindows.current !== undefined) {
			this.noCastWindows.current.actions.push(event)
			this.noCastWindows.current.doNothingForegivness += OGCD_OFFSET
			return
		}

		const actionRecast: number = this.getRecast(event.action)
		const casterTax: number = action.castTime !== undefined ? GCD_CASTER_TAX_OFFSET : 0
		let timeStamp = event.timestamp

		//coming from a hard cast, adjust for slidecasting
		if (this.hardCastStartTime != null) {
			timeStamp = this.hardCastStartTime
			this.hardCastStartTime = undefined
		}

		//don't check the time that you actually spent casting
		if (!this.noCastWindows.current) {
			this.noCastWindows.current = {
				start: timeStamp,
				startAction: event,
				recastTime: actionRecast,
				casterTax: casterTax,
				doNothingForegivness: 0,
				actions: [],
			}
			return
		}

		//check if it's been more than a gcd length
		this.checkAndSave(timeStamp, event)
		//this cast is our new last cast
		this.noCastWindows.current = {
			start: timeStamp,
			startAction: event,
			recastTime: actionRecast,
			casterTax: casterTax,
			doNothingForegivness: 0,
			actions: [],
		}
	}

	private onInterrupt(event: Events['interrupt']) {
		if (this.noCastWindows.current === undefined) { return }
		const action: Action | undefined = this.data.getAction(event.action)
		if (action === undefined) { return }
		if (this.noCastWindows.current.interruptedActions === undefined) { this.noCastWindows.current.interruptedActions = [] }
		this.noCastWindows.current.interruptedActions?.push(action)
		this.noCastWindows.current.doNothingForegivness += event.timestamp - this.prepareTime
	}

	//track how long dead and show it for ease of reference
	private onDeath(event: Events['death']) {
		if (this.noCastWindows.current === undefined) { return }
		this.aliveHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('statusRemove')
				.status(this.data.statuses.TRANSCENDENT.id),
			this.onResurrect,
		)
		this.timeOfDeath = event.timestamp
		//just in case a lil prepare got through. don't want to include it in this window on accident
		this.hardCastStartTime = undefined
		if (this.noCastWindows.current.deathCount === undefined) {
			this.noCastWindows.current.deathCount = 1
		} else {
			this.noCastWindows.current.deathCount += 1
		}
	}

	private onResurrect(event: Events['statusRemove']) {
		if (this.aliveHook !== undefined) {
			this.removeEventHook(this.aliveHook)
			this.aliveHook = undefined
		}
		if (this.noCastWindows.current === undefined || this.timeOfDeath === undefined) {
			this.timeOfDeath = undefined
			return
		}
		//forgive doing nothing when dead
		this.noCastWindows.current.doNothingForegivness += event.timestamp - this.timeOfDeath
	}

	/**
	 * Checks whether there was a violation and if so, pushes it, otherwise closes it
	 * @param {number} endTime time action is delivered to close the window
	 * @param {Action['id']} actionID ending action. Optional only in the event of the end of the fight
	 */
	private checkAndSave(endTime: number, eventAction?: Events['action']) {
		//no window no problem
		const tracker = this.noCastWindows
		if (tracker.current === undefined) { return }

		//return and reset if no violation
		if (!(endTime - tracker.current.start > tracker.current.recastTime + tracker.current.casterTax + GCD_JITTER_OFFSET
				|| (tracker.current.interruptedActions !== undefined && tracker.current.interruptedActions?.length !== 0))) {
			tracker.current = undefined
			return
		}

		// Close the window
		tracker.current.stop = endTime
		if (eventAction !== undefined) { tracker.current.stopAction = eventAction }
		tracker.history.push(tracker.current)
		tracker.current = undefined
	}

	/**
	 * Estimate recast based on GCD Length and base recast rounded up to 2 decimal places
	 * @param {Action['id']} action - desired action for recast
	 * @returns {number} - estimated recast for desired action, if no cast mentioned, returns base gcdLength
	 */
	private getRecast(action: Action['id']): number {
		const gcdLength: number = this.gcd.getDuration()
		const actionAttribute: Action['speedAttribute'] | undefined = this.data.getAction(action)?.speedAttribute
		const actionGCDRecastTime: number = this.data.getAction(action)?.gcdRecast ?? 0
		//TODO need to consider swiftcast since gcd could be less than recast (see blm)
		/**
		 * if there is no recast time, take base estimated gcd length
		 * if action speed attribute is undefined, assume recast time is always raw e.g. PCT canvas
		 * if there is a recast time impacted by speed attribute, estimate recast by base recast (2.5s) and actual gcd length.
		 * In this case, it's rounded up at 2 decimal places to give benefit of doubt
		 */
		const unroundedActionRecast: number
			= actionGCDRecastTime === 0 ? gcdLength
				: actionAttribute === undefined ? actionGCDRecastTime
					: gcdLength / BASE_RECAST * actionGCDRecastTime
		const actionRecast: number = Math.ceil(unroundedActionRecast * 100)/100
		return actionRecast
	}

	private onComplete(event: Events['complete']) {
		//finish up
		this.checkAndSave(event.timestamp)

		// Filter out periods where you got stunned, boss is untargetable, etc, or windows with negative durations
		this.noCastWindows.history = this.noCastWindows.history.filter(windows => {
			const duration = this.downtime.getDowntime(
				windows.start,
				windows.stop ?? windows.start,
			)
			return duration === 0
				&& (
					((windows.stop ?? windows.start) - windows.start > windows.recastTime + windows.casterTax + GCD_JITTER_OFFSET)
					|| (windows.interruptedActions !== undefined && windows.interruptedActions?.length !== 0)
				)
		})
	}

	override output() {
		if (this.noCastWindows.history.length === 0) { return <><Trans id="core.always-be-casting-table.no-violations">Nothing to note.</Trans> 😉</> }
		return <><Table compact unstackable celled collapsing>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell>
						<Trans id="core.always-be-casting-table.timestamp-header">Timestamp</Trans><br/>
						(<Trans id="core.always-be-casting-table.duration-header">Time between executed GCDs</Trans>)
					</Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.always-be-casting-table.action-header">Relevant action(s)</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.always-be-casting-table.weaving-header"># of Weaves</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.always-be-casting-table.interrupted-header">Interrupted Actions</Trans>*</Table.HeaderCell>
					<Table.HeaderCell>☠️</Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.always-be-casting-table.nothing-header">Doing nothing</Trans>**</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.noCastWindows.history.map(notCasting => {
					return <Table.Row key={notCasting.start}>
						<Table.Cell>
							<Button
								circular
								compact
								size="mini"
								icon="time"
								onClick={() => this.timeline.show(notCasting.start - this.parser.pull.timestamp, (notCasting.stop ?? notCasting.start) - this.parser.pull.timestamp)}
							/><br/>
							<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(notCasting.start)}</span>
							- <span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(notCasting.stop ?? notCasting.start)}</span>
							<br/>
							({this.parser.formatDuration((notCasting.stop ?? notCasting.start) - notCasting.start)})</Table.Cell>
						<Table.Cell>
							<Rotation events={[
								...(notCasting.startAction !== undefined ? [notCasting.startAction] : []), // don't want to show null action if individual weaves a lot in the beginning without any beginning actions
								...notCasting.actions,
								...(notCasting.stopAction !== undefined ? [notCasting.stopAction] : []), // don't want to show null action if individual weaves a lot close to the end without any ending actions
							]}/>
						</Table.Cell>
						<Table.Cell>
							{notCasting.actions.length !== 0 ? notCasting.actions.length : null}
						</Table.Cell>
						<Table.Cell>
							{notCasting.interruptedActions?.map(interruptedAction => {
								return <><ActionLink key={interruptedAction.id} {...interruptedAction} /><br/></>
							})}
						</Table.Cell>
						<Table.Cell>
							{notCasting.deathCount}
						</Table.Cell>
						<Table.Cell>
							{
								Math.max((notCasting.stop ?? notCasting.start) - notCasting.start - notCasting.doNothingForegivness, 0) > notCasting.recastTime + notCasting.casterTax + GCD_JITTER_OFFSET ?
									this.parser.formatDuration(Math.max((notCasting.stop ?? notCasting.start) - notCasting.start - notCasting.doNothingForegivness - notCasting.recastTime, 0))
									: null
							}
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
		<Message>
			* - <Trans id="core.always-be-casting-table.interruptions-disclaimer">Interruptions are included here regardless of ABC impact to provide additional context.</Trans>
		</Message>
		<Message>
			** - <Trans id="core.always-be-casting-table.nothing-disclaimer">Doing nothing is flagged if it can't be reasonably explained by weaving, death, or interrupts.</Trans>
		</Message>
		</>
	}
}
