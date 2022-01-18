import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'

interface ArmyWindow {
	start: number
	end: number
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private armyHistory: ArmyWindow[] = []
	private currentArmy: ArmyWindow | undefined = undefined

	override initialise() {
		super.initialise()

		const armyFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(oneOf([this.data.statuses.ARMYS_MUSE.id, this.data.statuses.ARMYS_PAEON.id]))

		this.addEventHook(armyFilter.type('statusApply'), this.onApplyArmy)
		this.addEventHook(armyFilter.type('statusRemove'), this.onRemoveArmy)
	}

	private onApplyArmy(event: Events['statusApply']) {
		if (this.currentArmy != null) { return }

		this.currentArmy = {
			start: event.timestamp,
			end: this.parser.pull.timestamp + this.parser.pull.duration,
		}

		this.armyHistory.push(this.currentArmy)
	}

	private onRemoveArmy(event: Events['statusRemove']) {
		if (this.currentArmy != null) {
			this.currentArmy.end = event.timestamp
			this.currentArmy = undefined
		}
	}

	override considerCast(action: Action, castStart: number): boolean {
		// Because Army's Paeon and Army's Muse reduce GCD speed by a variable amount that we can't synthesize, we exclude skills used under either buff from GCD uptime analysis
		if (this.currentArmy != null)  {
			this.debug(`Army's buff active at ${this.parser.formatEpochTimestamp(castStart)}`)
			return false
		}

		return super.considerCast(action, castStart)
	}

	override getUptimePercent(): number {
		this.debug(`Observed ${this.gcdsCounted} GCDs for a total of ${this.gcdUptime} ms of uptime`)
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const armyDuration = this.armyHistory.reduce((acc, army) => {
			const downtime = this.downtime.getDowntime(
				army.start,
				army.end,
			)
			return acc + army.end - army.start - downtime
		}, 0)
		// Because Army's Paeon and Army's Muse reduce GCD speed by a variable amount that we can't synthesize, we exclude time under either buff from GCD uptime analysis
		const uptime = this.gcdUptime / (fightDuration - armyDuration) * 100
		this.debug(`Total fight duration: ${this.parser.currentDuration} - Downtime: ${this.downtime.getDowntime()} - Army's Paeon or Muse active: ${armyDuration} - Uptime percentage ${uptime}`)

		return uptime
	}
}
