import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Table, Button} from 'semantic-ui-react'

import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'

//value to be added to the gcd to avoid false positives. 100ms for caster tax, 50ms for gcd jitter.
const GCD_ERROR_OFFSET = 150

//slide cast period is 500 ms.
const SLIDECAST_OFFSET = 500

export default class NotCasting extends Module {
	static handle = 'notcasting'
	static title = t('blm.notcasting.title')`Times you did literally nothing`
	static displayOrder = DISPLAY_ORDER.NOTCASTING

	static dependencies = [
		'timeline',
		'gcd',
		'invuln',
		'unableToAct',
	]

	_noCastWindows = {
		current: null,
		history: [],
	}
	_hardCast = false

	constructor(...args) {
		super(...args)

		this.addEventHook('begincast', {by: 'player'}, this._onBegin)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	_onCast(event) {
		//better than using 2.5s I guess
		const gcdLength = this.gcd.getEstimate(true)
		let timeStamp = event.timestamp

		//coming from a hard cast, adjust for slidecasting
		if (this._hardCast) {
			timeStamp = event.timestamp + SLIDECAST_OFFSET
			this._hardCast = false
		}

		//don't check the time that you actually spent casting
		if (!this._noCastWindows.current) {
			this._noCastWindows.current = {
				start: timeStamp,
			}
			return
		}

		//check if it's been more than a gcd length
		if (timeStamp - this._noCastWindows.current.start > gcdLength + GCD_ERROR_OFFSET) {
			this._stopAndSave(timeStamp)
		}
		//this cast is our new last cast
		this._noCastWindows.current = {
			start: timeStamp,
		}
	}

	_onBegin(event) {
		const gcdLength = this.gcd.getEstimate(true)
		if (this._noCastWindows.current) {
			if (event.timestamp - this._noCastWindows.current.start > gcdLength + GCD_ERROR_OFFSET) {
				this._stopAndSave(event.timestamp)
			}
			this._noCastWindows.current = null
			this._hardCast = true
		}
	}

	//reset to not count the time you lie on the ground as time you aren't casting : ^)
	_onDeath() { this._noCastWindows.current = null }

	_stopAndSave(endTime) {
		const tracker = this._noCastWindows

		// Already closed, nothing to do here
		if (!tracker.current) {
			return
		}

		// Close the window
		tracker.current.stop = endTime
		tracker.history.push(tracker.current)
		tracker.current = null
	}

	_onComplete(event) {
		const gcdLength = this.gcd.getEstimate(true)
		//finish up
		this._stopAndSave(event.timestamp)
		//filter out invuln periods
		this._noCastWindows.history = this._noCastWindows.history.filter(windows => {
			return this.invuln.getInvulns('all', windows.start, windows.stop).length === 0
		})
		// Filter out periods where you got stunned, etc
		this._noCastWindows.history = this._noCastWindows.history.filter(windows => {
			return this.unableToAct.getDowntimes(windows.start, windows.stop).length === 0
		})
		//filter out negative durations
		this._noCastWindows.history = this._noCastWindows.history.filter(windows => windows.stop - windows.start > gcdLength + GCD_ERROR_OFFSET)
	}

	output() {
		const gcdLength = this.gcd.getEstimate(true)
		if (this._noCastWindows.history.length === 0) { return }
		return <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="blm.notcasting.timestamp-header">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="blm.notcasting.duration-header">Duration</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this._noCastWindows.history.map(notCasting => {
					return <Table.Row key={notCasting.start}>
						<Table.Cell>{this.parser.formatTimestamp(notCasting.start)}</Table.Cell>
						<Table.Cell>&ge;{this.parser.formatDuration(notCasting.stop-notCasting.start-gcdLength-GCD_ERROR_OFFSET)}</Table.Cell>
						<Table.Cell>
							<Button onClick={() =>
								this.timeline.show(notCasting.start - this.parser.fight.start_time, notCasting.stop - this.parser.fight.start_time)}>
								<Trans id="blm.notcasting.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>

	}
}
