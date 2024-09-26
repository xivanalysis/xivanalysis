import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Table, Button} from 'semantic-ui-react'
import {Data} from './Data'

//value to be added to the gcd to avoid false positives. 100ms for caster tax, 50ms for gcd jitter.
const GCD_ERROR_OFFSET = 150
const BASE_RECAST = 2500

interface Window {
	start: number,
	stop?: number,
	recastTime: number,
}

export class NotCasting extends Analyser {
	static override handle = 'notcasting'
	static override title = t('core.notcasting.title')`Times you did literally nothing`

	@dependency private timeline!: Timeline
	@dependency protected gcd!: GlobalCooldown
	@dependency protected downtime!: Downtime
	@dependency protected data!: Data

	// give some options depending on what is optimal for that job
	protected includeOGCDs: boolean = false

	private noCastWindows: {current?: Window, history: Window[]} = {
		history: [],
	}
	private hardCastStartTime: number | undefined = undefined

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('prepare'), this.onBegin)
		this.addEventHook(playerFilter.type('action'), this.onCast)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']) {
		//some jobs might care about oGCDs. e.g. BLM
		const actionIsOGCD: boolean = !this.data.getAction(event.action)?.onGcd ?? false
		if (!this.includeOGCDs && actionIsOGCD) { return }

		const actionRecast: number = this.getRecast(event.action)

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
				recastTime: actionRecast,
			}
			return
		}

		//check if it's been more than a gcd length
		if (timeStamp - this.noCastWindows.current.start > actionRecast + GCD_ERROR_OFFSET) {
			this.stopAndSave(timeStamp)
		}
		//this cast is our new last cast
		this.noCastWindows.current = {
			start: timeStamp,
			recastTime: actionRecast,
		}
	}

	private onBegin(event: Events['prepare']) {
		const actionIsOGCD: boolean = !this.data.getAction(event.action)?.onGcd ?? false
		//some jobs might care about oGCDs. e.g. BLM
		if (!this.includeOGCDs && actionIsOGCD) { return }

		const actionRecast = this.getRecast(event.action)
		if (this.noCastWindows.current) {
			if (event.timestamp - this.noCastWindows.current.start > actionRecast + GCD_ERROR_OFFSET) {
				this.stopAndSave(event.timestamp)
			}
			this.noCastWindows.current = undefined
			this.hardCastStartTime = event.timestamp
		}
	}

	//reset to not count the time you lie on the ground as time you aren't casting : ^)
	private onDeath() { this.noCastWindows.current = undefined }

	private stopAndSave(endTime: number) {
		const tracker = this.noCastWindows

		// Already closed, nothing to do here
		if (!tracker.current) {
			return
		}

		// Close the window
		tracker.current.stop = endTime
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
		this.stopAndSave(event.timestamp)

		// Filter out periods where you got stunned, boss is untargetable, etc, or windows with negative durations
		this.noCastWindows.history = this.noCastWindows.history.filter(windows => {
			const duration = this.downtime.getDowntime(
				windows.start,
				windows.stop ?? windows.start,
			)
			return duration === 0 && (windows.stop ?? windows.start) - windows.start > windows.recastTime + GCD_ERROR_OFFSET
		})
	}

	override output() {
		if (this.noCastWindows.history.length === 0) { return }
		return <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="core.notcasting.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.notcasting.duration-header">Duration</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.noCastWindows.history.map(notCasting => {
					return <Table.Row key={notCasting.start}>
						<Table.Cell>{this.parser.formatEpochTimestamp(notCasting.start)}</Table.Cell>
						<Table.Cell>&ge;{this.parser.formatDuration((notCasting.stop ?? notCasting.start) - notCasting.start - notCasting.recastTime)}</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(notCasting.start - this.parser.pull.timestamp, (notCasting.stop ?? notCasting.start) - this.parser.pull.timestamp)}>
								<Trans id="core.notcasting.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
