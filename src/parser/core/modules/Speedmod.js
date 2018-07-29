import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {
	PARTYWIDE_SPEED_BUFF_FLAGS,
	JOB_SPEED_BUFF_TO_SPEEDMOD_MAP,
	SPEED_BUFF_STATUS_IDS,
	PARTYWIDE_SPEED_BUFF_TO_FLAG_MAP,
} from './SpeedmodConsts'

// TODO: Prepull Fey Wind is not caught by this. Probably same with Arrow. Need to do something to handle that
export default class Speedmod extends Module {
	static handle = 'speedmod'
	static dependencies = [
		'arcanum', // We rely on its normaliser to handle arrow strength mod
		'precastStatus',
	]

	// Track history of speedmods
	_history = [{speedmod: 1, start: 0, end: Infinity}]

	_activePartywideSpeedBuffFlags = 0
	_activeSpeedMap = JOB_SPEED_BUFF_TO_SPEEDMOD_MAP[0]

	normalise(events) {
		const types = ['applybuff', 'removebuff']

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Only care about certain events to the player
			if (
				!event.ability ||
				!types.includes(event.type) ||
				!SPEED_BUFF_STATUS_IDS.includes(event.ability.guid) ||
				!this.parser.toPlayer(event)
			) { continue }

			const jobSpeedMap = JOB_SPEED_BUFF_TO_SPEEDMOD_MAP[event.ability.guid]
			if (jobSpeedMap != null) {
				if (event.type === 'applybuff') {
					this._activeSpeedMap = jobSpeedMap
				} else if (event.type === 'removebuff') {
					this._activeSpeedMap = JOB_SPEED_BUFF_TO_SPEEDMOD_MAP[0]
				}
			}

			const partywideSpeedBuffFlag = PARTYWIDE_SPEED_BUFF_TO_FLAG_MAP[event.ability.guid]
			if (partywideSpeedBuffFlag != null) {
				if (event.type === 'applybuff') {
					if (event.ability.guid === STATUSES.THE_ARROW.id) {
						this._activePartywideSpeedBuffFlags |= partywideSpeedBuffFlag[event.strengthModifier]
					} else {
						this._activePartywideSpeedBuffFlags |= partywideSpeedBuffFlag
					}
				} else if (event.type === 'removebuff') {
					if (event.ability.guid === STATUSES.THE_ARROW.id) {
						this._activePartywideSpeedBuffFlags &= ~PARTYWIDE_SPEED_BUFF_FLAGS.ARROW_ALL
					} else {
						this._activePartywideSpeedBuffFlags &= ~partywideSpeedBuffFlag
					}
				}
			}

			// Recalculate the speedmod and save to history
			this._history[this._history.length - 1].end = event.timestamp-1
			this._history.push({
				speedmod: this._activeSpeedMap[this._activePartywideSpeedBuffFlags] / 100,
				start: event.timestamp,
				end: Infinity,
			})
		}

		return events
	}

	get(timestamp = this.parser.currentTimestamp) {
		return this._history.find(h => h.start <= timestamp && h.end >= timestamp).speedmod
	}
}
