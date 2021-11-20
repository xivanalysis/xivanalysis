/**
 * @author Yumiya
 */
import Module from 'parser/core/Module'
import React from 'react'
import {Button} from 'semantic-ui-react'

export default class Util extends Module {
	static handle = 'util'
	static dependencies = [
		'timeline',
	]

	formatDecimal(number, precision = 2) {
		if (!Number.isInteger(precision) || precision < 0) {
			precision = 2
		}

		const BASE = 10
		return Math.round(number * Math.pow(BASE, precision))/Math.pow(BASE, precision)
	}

	createTimelineButton(timestamp) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}
}
