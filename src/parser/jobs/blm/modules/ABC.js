import React from 'react'

import Module from 'parser/core/Module'
import {i18nMark, Trans} from '@lingui/react'
import {Table, Button} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

//value to be added to the gcd to avoid false positives
const GCD_ERROR_OFFSET = 100
/*since we look at end of a cast => beginning of a new one, we need to account for the time that's still on the gcd since we
can literally not cast in that period. 1s is too much, but better than substracting not enough*/
const DURATION_ERROR_OFFSET = 1000

export default class AlwaysBeCasting extends Module {
	static handle = 'blackmage_abc'
	static i18n_id = i18nMark('blm.abc.title')
	static title = 'Times you did literally nothing'
	static displayOrder = DISPLAY_ORDER.ABC

	static dependencies = [
		'timeline',
		'gcd',
		'invuln',
	]

	_noCastWindows = {
		current: null,
		history: [],
	}

	constructor(...args) {
		super(...args)

		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		//better than using 2.5s I guess
		const gcdLength = this.gcd.getEstimate(false)
		//don't check the time that you actually spent casting
		if (!this._noCastWindows.current) {
			this._noCastWindows.current = {
				start: event.timestamp,
			}
			return
		}
		//check if it's been more than a gcd length
		if (event.timestamp - this._noCastWindows.current.start > gcdLength + GCD_ERROR_OFFSET) {
			this._stopAndSave(event.timestamp)
		}
		//this cast is our new last cast
		this._noCastWindows.current = {
			start: event.timestamp,
		}
	}

	_onBegin(event) {
		const gcdLength = this.gcd.getEstimate(false)
		if (this._noCastWindows.current) {
			if (event.timestamp - this._noCastWindows.current.start > gcdLength + GCD_ERROR_OFFSET) {
				this._stopAndSave(event.timestamp)
			}
			this._noCastWindows.current = null
		}
	}

	//reset to not count the time you lie on the ground as time you aren't casting : ^)
	_onDeath() { this._noCastWindows.current = null }

	_stopAndSave(endTime = this.parser.currentTimestamp) {
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
		//finish up
		this._stopAndSave(event.timestamp)
		//filter out invuln periods
		this._noCastWindows.history = this._noCastWindows.history.filter(windows => {
			return this.invuln.getInvulns('all', windows.start, windows.stop).length === 0
		})
		//filter out negative durations
		this._noCastWindows.history = this._noCastWindows.history.filter(windows => windows.stop - windows.start > DURATION_ERROR_OFFSET)
	}

	output() {
		if (this._noCastWindows.history.length > 0) {
			return <Table collapsing unstackable compact="very">
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="blm.abc.timestamp-header">Timestamp</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="blm.abc.duration-header">Duration</Trans></Table.HeaderCell>
						<Table.HeaderCell></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this._noCastWindows.history.map(notCasting => {
						return <Table.Row key={notCasting.start}>
							<Table.Cell>{this.parser.formatTimestamp(notCasting.start)}</Table.Cell>
							<Table.Cell>&ge;{this.parser.formatDuration(notCasting.stop-notCasting.start-DURATION_ERROR_OFFSET)}</Table.Cell>
							<Table.Cell>
								<Button onClick={() =>
									this.timeline.show(notCasting.start - this.parser.fight.start_time, notCasting.stop - this.parser.fight.start_time)}>
									<Trans id="blm.abc.timelinelink-button">Jump to Timeline</Trans>
								</Button>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		}
	}
}
