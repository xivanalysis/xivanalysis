import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {Timeline} from 'parser/core/modules/Timeline'
import {CompleteEvent} from 'parser/core/Parser'
import React from 'react'
import {Table, Button} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

//value to be added to the gcd to avoid false positives. 100ms for caster tax, 50ms for gcd jitter.
const GCD_ERROR_OFFSET = 150

//slide cast period is 500 ms.
const SLIDECAST_OFFSET = 500

interface Window {
	start: number,
	stop?: number
}

export default class NotCasting extends Module {
	static override handle = 'notcasting'
	static override title = t('blm.notcasting.title')`Times you did literally nothing`
	static override displayOrder = DISPLAY_ORDER.NOTCASTING

	@dependency private timeline!: Timeline
	@dependency private gcd!: GlobalCooldown
	@dependency private downtime!: Downtime

	private noCastWindows: {current?: Window, history: Window[]} = {
		history: [],
	}
	private hardCast = false

	override init() {
		this.addEventHook('begincast', {by: 'player'}, this.onBegin)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		//better than using 2.5s I guess
		const gcdLength = this.gcd.getEstimate()
		let timeStamp = event.timestamp

		//coming from a hard cast, adjust for slidecasting
		if (this.hardCast) {
			timeStamp = event.timestamp + SLIDECAST_OFFSET
			this.hardCast = false
		}

		//don't check the time that you actually spent casting
		if (!this.noCastWindows.current) {
			this.noCastWindows.current = {
				start: timeStamp,
			}
			return
		}

		//check if it's been more than a gcd length
		if (timeStamp - this.noCastWindows.current.start > gcdLength + GCD_ERROR_OFFSET) {
			this.stopAndSave(timeStamp)
		}
		//this cast is our new last cast
		this.noCastWindows.current = {
			start: timeStamp,
		}
	}

	private onBegin(event: CastEvent) {
		const gcdLength = this.gcd.getEstimate()
		if (this.noCastWindows.current) {
			if (event.timestamp - this.noCastWindows.current.start > gcdLength + GCD_ERROR_OFFSET) {
				this.stopAndSave(event.timestamp)
			}
			this.noCastWindows.current = undefined
			this.hardCast = true
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

	private onComplete(event: CompleteEvent) {
		const gcdLength = this.gcd.getEstimate()
		//finish up
		this.stopAndSave(event.timestamp)

		// Filter out periods where you got stunned, boss is untargetable, etc
		this.noCastWindows.history = this.noCastWindows.history.filter(windows => {
			const duration = this.downtime.getDowntime(
				this.parser.fflogsToEpoch(windows.start),
				this.parser.fflogsToEpoch(windows.stop ?? windows.start),
			)
			return duration === 0
		})
		//filter out negative durations
		this.noCastWindows.history = this.noCastWindows.history.filter(windows => (windows.stop ?? windows.start) - windows.start > gcdLength + GCD_ERROR_OFFSET)
	}

	override output() {
		const gcdLength = this.gcd.getEstimate()
		if (this.noCastWindows.history.length === 0) { return }
		return <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="blm.notcasting.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.notcasting.duration-header">Duration</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.noCastWindows.history.map(notCasting => {
					return <Table.Row key={notCasting.start}>
						<Table.Cell>{this.parser.formatTimestamp(notCasting.start)}</Table.Cell>
						<Table.Cell>&ge;{this.parser.formatDuration((notCasting.stop ?? notCasting.start) -notCasting.start-gcdLength-GCD_ERROR_OFFSET)}</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(notCasting.start - this.parser.fight.start_time, (notCasting.stop ?? notCasting.start) - this.parser.fight.start_time)}>
								<Trans id="blm.notcasting.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>

	}
}
