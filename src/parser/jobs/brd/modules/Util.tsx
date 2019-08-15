/**
 * @author Yumiya
 * @author Ririan
 */

import {DamageEvent, Event} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import Downtime from 'parser/core/modules/Downtime'
import Enemies from 'parser/core/modules/Enemies'
import Invuln from 'parser/core/modules/Invulnerability'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'
import {Button} from 'semantic-ui-react'
import AdditionalStats from './AdditionalStats'

const CONVERSION_FACTOR = 0.1

const DHIT_MOD = 1.25

const TRAIT_STRENGTH = 0.20

interface StatusEffect {
	id: number
	name: string
	icon: string
	duration?: number
	amount?: number
}
interface DowntimeInfo {
	start: number
	end: number
}
interface AdditionalDamageEvent extends DamageEvent {
	criticalHit: number
	directHit: number
}

export default class Util extends Module {
	static handle = 'util'

	@dependency private combatants!: Combatants
	@dependency private downtime!: Downtime
	@dependency private enemies!: Enemies
	@dependency private invuln!: Invuln
	@dependency private timeline!: Timeline
	@dependency private additionalStats!: AdditionalStats

	hasBuff(status: StatusEffect) {
		return this.combatants.selected.hasStatus(status.id)
	}

	getDebuffUptime(status: StatusEffect) {
		const statusTime = this.enemies.getStatusUptime(status.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	getBuffUptime(status: StatusEffect) {
		const statusTime = this.combatants.getStatusUptime(status.id, this.parser.player.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	getDowntimeLength(timestamp: number) {
		const window = this.downtime.getDowntimeWindows().filter((x: DowntimeInfo) => x.start <= timestamp && x.end >= timestamp)
		return Math.max(0, (window.end - window.start) / 1000)
	}

	formatDecimal(numberToFormat: number, precision = 2) {
		if (!Number.isInteger(precision) || precision < 0) {
			precision = 2
		}

		const BASE = 10
		return Math.round(numberToFormat * Math.pow(BASE, precision))/Math.pow(BASE, precision)
	}

	formatDamageLog(event: DamageEvent) {

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

	formatTimestamp(timestamp: number) {
		timestamp = Math.max(timestamp, this.parser.fight.start_time)
		return this.parser.formatTimestamp(timestamp)
	}

	milliToSeconds(time: number, precision: number) {
		return this.formatDecimal(time / 1000, precision)
	}

	timeSince(timestamp: number) {
		return this.parser.currentTimestamp - timestamp
	}

	timeUntilFinish(timestamp: number) {
		return this.parser.fight.end_time - timestamp
	}

	createTimelineButton(timestamp: number) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}

	formatDamageNumber(damageNumber: number) {
		return damageNumber.toLocaleString(undefined, {maximumFractionDigits: 2})
	}

	getApproximatePotency(event: AdditionalDamageEvent) {
		const potencyDamageRatio = this.additionalStats.potencyDamageRatio

		let fixedMultiplier = event.debugMultiplier || 0

		// AND ALSO FOR RANGED TRAIT, BECAUSE APPARENTLY IT'S PHYSICAL DAMAGE ONLY REEEEEEEEEE
		fixedMultiplier = Math.trunc((fixedMultiplier + TRAIT_STRENGTH) * 100) / 100

		// We get the unbuffed damage
		let rawDamage = event.amount / fixedMultiplier

		// And then strip off critical hit and direct hit mods
		if (event.criticalHit) {
			rawDamage = Math.trunc(rawDamage / this.additionalStats.critMod)
		}

		if (event.directHit) {
			rawDamage = Math.trunc(rawDamage / DHIT_MOD)
		}

		// We get the approximated potency
		return rawDamage * 100 / potencyDamageRatio
	}
}
