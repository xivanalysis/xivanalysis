/**
 * @author Yumiya
 */
import React from 'react'
import Module from 'parser/core/Module'

import {Button} from 'semantic-ui-react'

export default class Util extends Module {
	static handle = 'util'
	static dependencies = [
		'combatants',
		'downtime',
		'enemies',
		'invuln',
		'timeline',
	]

	hasBuff(status) {
		return this.combatants.selected.hasStatus(status.id)
	}

	getDebuffUptime(status) {
		const statusTime = this.enemies.getStatusUptime(status.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	getBuffUptime(status) {
		const statusTime = this.combatants.getStatusUptime(status.id, this.parser.player.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	getDowntimeLength(timestamp) {
		const window = this.downtime.getDowntimeWindows().filter(x => x.start <= timestamp && x.end >= timestamp)
		return Math.max(0, (window.end - window.start) / 1000)
	}

	formatDecimal(number, precision = 2) {
		if (!Number.isInteger(precision) || precision < 0) {
			precision = 2
		}

		const BASE = 10
		return Math.round(number * Math.pow(BASE, precision))/Math.pow(BASE, precision)
	}

	formatDamageLog(event) {

		if (event && event.type && event.type !== 'damage') {
			return
		}

		let modifier = ''

		if (event.multistrike && event.hitType && event.hitType === 2) {
			modifier = 'Critical direct hit! '
		} else if (!event.multistrike && event.hitType && event.hitType === 2) {
			modifier = 'Critical! '
		} else if (event.multistrike && !event.hitType || event.hitType === 1) {
			modifier = 'Direct hit! '
		}
		return `${modifier}${event.target && event.target.name ? event.target.name : this.enemies.getEntity(event.targetID).name || 'Target'} takes ${event.amount} damage.`

	}

	formatTimestamp(timestamp) {
		timestamp = Math.max(timestamp, this.parser.fight.start_time)
		return this.parser.formatTimestamp(timestamp)
	}

	milliToSeconds(time, precision) {
		return this.formatDecimal(time / 1000, precision)
	}

	timeSince(timestamp) {
		return this.parser.currentTimestamp - timestamp
	}

	timeUntilFinish(timestamp) {
		return this.parser.fight.end_time - timestamp
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

	formatDamageNumber(damageNumber) {
		return damageNumber.toLocaleString({maximumFractionDigits: 2})
	}
}
