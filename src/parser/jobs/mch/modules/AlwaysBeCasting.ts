import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'

interface FlameWindow {
	start: number
	end: number
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private flameHistory: FlameWindow[] = []
	private currentFlame: FlameWindow | undefined = undefined

	override initialise() {
		super.initialise()

		const flamethrowerFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.FLAMETHROWER.id)

		this.addEventHook(flamethrowerFilter.type('statusApply'), this.onApplyFlamethrower)
		this.addEventHook(flamethrowerFilter.type('statusRemove'), this.onRemoveFlamethrower)
	}

	private onApplyFlamethrower(event: Events['statusApply']) {
		if (this.currentFlame != null) { return }

		this.currentFlame = {
			start: event.timestamp,
			end: this.parser.pull.timestamp + this.parser.pull.duration,
		}

		this.flameHistory.push(this.currentFlame)
	}

	private onRemoveFlamethrower(event: Events['statusRemove']) {
		if (this.currentFlame != null) {
			this.currentFlame.end = event.timestamp
			this.currentFlame = undefined
		}
	}

	override considerCast(action: Action, castStart: number): boolean {
		if (action === this.data.actions.FLAMETHROWER)  {
			this.debug(`Flamethrower began channeling at ${this.parser.formatEpochTimestamp(castStart)}`)
			return false
		}

		return super.considerCast(action, castStart)
	}

	override getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const flameDuration = this.flameHistory.reduce((acc, flame) => {
			const downtime = this.downtime.getDowntime(
				flame.start,
				flame.end,
			)
			return acc + flame.end - flame.start - downtime
		}, 0)
		const uptime = (this.gcdUptime + flameDuration) / (fightDuration) * 100

		return uptime
	}
}
