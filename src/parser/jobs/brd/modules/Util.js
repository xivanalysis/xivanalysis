/**
 * @author Yumiya
 */
import Module from 'parser/core/Module'
import React from 'react'
import {Button} from 'semantic-ui-react'

export default class Util extends Module {
	static handle = 'util'
	static dependencies = [
		'combatants',
		'downtime',
		'enemies',
		'entityStatuses',
		'invulnerability',
		'timeline',
	]

	getDebuffUptime(status) {
		const statusTime = this.entityStatuses.getStatusUptime(status.id, this.enemies.getEntities())
		const uptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusTime / uptime) * 100
	}

	getBuffUptime(status) {
		const statusTime = this.entityStatuses.getStatusUptime(status.id, this.combatants.getEntities())
		const uptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusTime / uptime) * 100
	}

	getDowntimeLength(timestamp) {
		const window = this.downtime.getDowntimeWindows()
			.map(window => ({
				start: this.parser.epochToFflogs(window.start),
				end: this.parser.epochToFflogs(window.end),
			}))
			.find(x => x.start <= timestamp && x.end >= timestamp)
		return Math.max(0, (window.end - window.start) / 1000)
	}

	formatDecimal(number, precision = 2) {
		if (!Number.isInteger(precision) || precision < 0) {
			precision = 2
		}

		const BASE = 10
		return Math.round(number * Math.pow(BASE, precision))/Math.pow(BASE, precision)
	}

	formatTimestamp(timestamp) {
		timestamp = Math.max(timestamp, this.parser.fight.start_time)
		return this.parser.formatTimestamp(timestamp)
	}

	milliToSeconds(time, precision) {
		return this.formatDecimal(time / 1000, precision)
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
