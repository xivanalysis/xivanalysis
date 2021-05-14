import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import CoreAlwaysBeCasting from 'parser/core/modules/AlwaysBeCasting'

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const SONG_DURATION_MS = 30 * 1000

interface ArmyWindow {
	start: number,
	end: number
}

export default class AlwaysBeCasting extends CoreAlwaysBeCasting {
	armyHistory: ArmyWindow[] = []
	currentMuse: ArmyWindow | undefined
	currentPaeon: ArmyWindow | undefined

	protected override init() {
		super.init()
		this.addEventHook('applybuff', {by: 'player', abilityId: [STATUSES.ARMYS_MUSE.id]}, this.onMuse)
		this.addEventHook('removebuff', {by: 'player', abilityId: [STATUSES.ARMYS_MUSE.id]}, this.onRemoveMuse)
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.THE_WANDERERS_MINUET.id, ACTIONS.MAGES_BALLAD.id, ACTIONS.ARMYS_PAEON.id]}, this.onSong)
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

	private onMuse(event: BuffEvent) {
		this.currentMuse = {
			start: event.timestamp,
			end: Math.min(this.parser.fight.end_time, event.timestamp + STATUSES.ARMYS_MUSE.duration),
		}
	}

	private onRemoveMuse(event: BuffEvent) {
		if (this.currentMuse) {
			this.currentMuse.end = event.timestamp
			this.endMuse()
		}
	}

	private onSong(event: CastEvent) {
		if (event.ability.guid === ACTIONS.ARMYS_PAEON.id) {
			this.currentPaeon = {
				start: event.timestamp,
				end: Math.min(this.parser.fight.end_time, event.timestamp + SONG_DURATION_MS),
			}
		} else if (this.currentPaeon) {
			this.currentPaeon.end = event.timestamp
			this.endPaeon()
		}
	}

	private isArmyBuffActive(timestamp: number): boolean {
		return this.armyHistory.some(army => timestamp > army.start && timestamp < army.end)
	}

	protected override getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const armyDuration = this.armyHistory.reduce((acc, army) => {
			const downtime = this.downtime.getDowntime(army.start, army.end)
			return acc + army.end - army.start - downtime
		}, 0)

		const uptime = this.gcd.gcds.reduce((acc, gcd) => {
			const duration = this.gcd._getGcdLength(gcd)
			const downtime = this.downtime.getDowntime(
				gcd.timestamp,
				Math.min(gcd.timestamp + duration, this.parser.eventTimeOffset + this.parser.pull.duration)
			)
			// Ignore GCDs while muse / paeon were up
			if (this.isArmyBuffActive(gcd.timestamp)) {
				return acc
			}
			return acc + duration - downtime
		}, 0)

		return uptime / (fightDuration - armyDuration) * 100
	}
}
