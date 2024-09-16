import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Table, Button} from 'semantic-ui-react'

//value to be added to the gcd to avoid false positives. 100ms for caster tax, 50ms for gcd jitter.
const GCD_ERROR_OFFSET = 150

//slide cast period is 500 ms.
const SLIDECAST_OFFSET = 500

interface Window {
	start: number,
	stop?: number
}

export class NotCasting extends Analyser {
	static override handle = 'notcasting'
	static override title = t('core.notcasting.title')`Times you did literally nothing`

	@dependency private timeline!: Timeline
	@dependency protected gcd!: GlobalCooldown
	@dependency protected downtime!: Downtime

	private noCastWindows: {current?: Window, history: Window[]} = {
		history: [],
	}
	private hardCast = false

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
		//better than using 2.5s I guess
		const gcdLength = this.gcd.getDuration()
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

	private onBegin(event: Events['prepare']) {
		const gcdLength = this.gcd.getDuration()
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

	private onComplete(event: Events['complete']) {
		const gcdLength = this.gcd.getDuration()
		//finish up
		this.stopAndSave(event.timestamp)

		// Filter out periods where you got stunned, boss is untargetable, etc, or windows with negative durations
		this.noCastWindows.history = this.noCastWindows.history.filter(windows => {
			const duration = this.downtime.getDowntime(
				windows.start,
				windows.stop ?? windows.start,
			)
			return duration === 0 && (windows.stop ?? windows.start) - windows.start > gcdLength + GCD_ERROR_OFFSET
		})
	}

	override output() {
		const gcdLength = this.gcd.getDuration()
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
						<Table.Cell>&ge;{this.parser.formatDuration((notCasting.stop ?? notCasting.start) - notCasting.start - gcdLength - GCD_ERROR_OFFSET)}</Table.Cell>
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
