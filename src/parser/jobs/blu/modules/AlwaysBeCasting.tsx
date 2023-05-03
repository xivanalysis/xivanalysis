import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, noneOf} from 'parser/core/filter'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'

// Essentially a carbon copy of the MCH extension to ABC -- we want to treat
// Phantom Flurry as a Flamethrower-like.

// This also removes the time under Waning Nocturne (the second half of Moon Flute)
// from the ABC report.  Can't cast, am waning.

interface PhantomFlurryWindow {
	start: number
	end: number
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private phantomFlurryHistory: PhantomFlurryWindow[] = []
	private currentPhantomFlurry: PhantomFlurryWindow | undefined = undefined
	private phantomFlurryInterruptingActionHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const phantomFlurryCastFilter = playerFilter
			.action(this.data.actions.PHANTOM_FLURRY.id)
			.type('action')
		const phantomFlurryStatusFilter = playerFilter
			.status(this.data.statuses.PHANTOM_FLURRY.id)
			.type('statusRemove')

		this.addEventHook(phantomFlurryCastFilter, this.onApplyPhantomFlurry)
		this.addEventHook(phantomFlurryStatusFilter, this.onRemovePhantomFlurry)
	}

	private onApplyPhantomFlurry(event: Events['action']) {
		if (this.currentPhantomFlurry != null) { return }

		this.currentPhantomFlurry = {
			start: event.timestamp,
			end: event.timestamp + this.data.statuses.PHANTOM_FLURRY.duration,
		}
		const anyActionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.action(noneOf([this.data.actions.PHANTOM_FLURRY.id]))
			.type('action')
		this.phantomFlurryInterruptingActionHook = this.addEventHook(anyActionFilter, this.onRemovePhantomFlurry)

		this.phantomFlurryHistory.push(this.currentPhantomFlurry)
	}

	private onRemovePhantomFlurry(event: Events['statusRemove'] | Events['action']) {
		if (this.currentPhantomFlurry == null) {
			return
		}
		if (this.phantomFlurryInterruptingActionHook == null) {
			return
		}

		this.currentPhantomFlurry.end = event.timestamp
		this.removeEventHook(this.phantomFlurryInterruptingActionHook)

		this.currentPhantomFlurry = undefined
		this.phantomFlurryInterruptingActionHook = undefined

	}

	override considerCast(action: Action, castStart: number): boolean {
		if (action === this.data.actions.PHANTOM_FLURRY) {
			this.debug(`Phantom Flurry began channeling at ${this.parser.formatEpochTimestamp(castStart)}`)
			return false
		}

		return super.considerCast(action, castStart)
	}

	override getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const flurryDuration = this.phantomFlurryHistory.reduce((acc, flurry) => {
			const downtime = this.downtime.getDowntime(
				flurry.start,
				flurry.end,
			)
			const phantomFlurryDurationOrGCD = Math.max(flurry.end - flurry.start, this.globalCooldown.getDuration())
			return acc + phantomFlurryDurationOrGCD - downtime
		}, 0)
		const uptime = (this.gcdUptime + flurryDuration) / (fightDuration) * 100

		return uptime
	}
}
