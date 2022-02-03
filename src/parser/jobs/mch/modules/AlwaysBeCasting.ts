import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, noneOf} from 'parser/core/filter'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'

interface FlameWindow {
	start: number
	end: number
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private flameHistory: FlameWindow[] = []
	private currentFlame: FlameWindow | undefined = undefined
	private flamethrowerInterruptingActionHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const flamethrowerCastFilter = playerFilter
			.action(this.data.actions.FLAMETHROWER.id)
			.type('action')
		const flamethrowerStatusFilter = playerFilter
			.status(this.data.statuses.FLAMETHROWER.id)
			.type('statusRemove')

		this.addEventHook(flamethrowerCastFilter, this.onApplyFlamethrower)
		this.addEventHook(flamethrowerStatusFilter, this.onRemoveFlamethrower)
	}

	private onApplyFlamethrower(event: Events['action']) {
		if (this.currentFlame != null) { return }

		this.currentFlame = {
			start: event.timestamp,
			end: event.timestamp + this.data.statuses.FLAMETHROWER.duration,
		}
		const anyActionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.action(noneOf([this.data.actions.FLAMETHROWER.id]))
			.type('action')
		this.flamethrowerInterruptingActionHook = this.addEventHook(anyActionFilter, this.onRemoveFlamethrower)

		this.flameHistory.push(this.currentFlame)
	}

	private onRemoveFlamethrower(event: Events['statusRemove'] | Events['action']) {
		if (this.currentFlame == null) {
			return
		}
		if (this.flamethrowerInterruptingActionHook == null) {
			return
		}

		this.currentFlame.end = event.timestamp
		this.removeEventHook(this.flamethrowerInterruptingActionHook)

		this.currentFlame = undefined
		this.flamethrowerInterruptingActionHook = undefined

	}

	override considerCast(action: Action, castStart: number): boolean {
		if (action === this.data.actions.FLAMETHROWER) {
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
			const flamethrowerDurationOrGCD = Math.max(flame.end - flame.start, this.globalCooldown.getDuration())
			return acc + flamethrowerDurationOrGCD - downtime
		}, 0)
		const uptime = (this.gcdUptime + flameDuration) / (fightDuration) * 100

		return uptime
	}
}
