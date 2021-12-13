import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'

const SONG_DURATION_MS = 30000

interface ArmyWindow {
	start: number,
	end: number
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	armyHistory: ArmyWindow[] = []
	currentMuse: ArmyWindow | undefined
	currentPaeon: ArmyWindow | undefined

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.ARMYS_MUSE.id), this.onApplyMuse)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.ARMYS_MUSE.id), this.onRemoveMuse)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(['THE_WANDERERS_MINUET', 'MAGES_BALLAD', 'ARMYS_PAEON'])), this.onSong)
	}

	private endMuse() {
		if (this.currentMuse) {
			this.armyHistory.push(this.currentMuse)
			this.currentMuse = undefined
		}
	}

	private endPaeon() {
		if (this.currentPaeon) {
			this.armyHistory.push(this.currentPaeon)
			this.currentPaeon = undefined
		}
	}

	private onApplyMuse(event: Events['statusApply']) {
		this.currentMuse = {
			start: event.timestamp,
			end: Math.min(this.parser.pull.timestamp + this.parser.pull.duration, event.timestamp + this.data.statuses.ARMYS_MUSE.duration),
		}
	}

	private onRemoveMuse(event: Events['statusRemove']) {
		if (this.currentMuse) {
			this.currentMuse.end = event.timestamp
			this.endMuse()
		}
	}

	private onSong(event: Events['action']) {
		if (event.action === this.data.actions.ARMYS_PAEON.id) {
			this.currentPaeon = {
				start: event.timestamp,
				end: Math.min(this.parser.pull.timestamp + this.parser.pull.duration, event.timestamp + SONG_DURATION_MS),
			}
			this.addTimestampHook(event.timestamp + SONG_DURATION_MS, () => this.endPaeon)
		} else if (this.currentPaeon) {
			this.currentPaeon.end = event.timestamp
			this.endPaeon()
		}
	}

	override considerCast(action: Action, castStart: number): boolean {
		// Because Army's Paeon and Army's Muse reduce GCD speed by a variable amount that we can't synthesize, we exclude skills used under either buff from GCD uptime analysis
		if (this.currentPaeon)  {
			this.debug(`Army's Paeon active at ${this.parser.formatEpochTimestamp(castStart)}`)
			return false
		}
		if (this.currentMuse) {
			this.debug(`Army's Muse active at ${this.parser.formatEpochTimestamp(castStart)}`)
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
