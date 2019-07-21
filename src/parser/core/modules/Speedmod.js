import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {
	PARTYWIDE_SPEED_BUFF_FLAGS,
	JOB_SPEED_BUFF_TO_SPEEDMOD_MAP,
	PARTYWIDE_SPEED_BUFF_TO_FLAG_MAP,
} from './SpeedmodConsts'

export default class Speedmod extends Module {
	static handle = 'speedmod'
	static dependencies = [
		// We rely on these modules for normaliser logic
		'arcanum', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'precastStatus', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	// List of statuses we natively handle (See SpeedmodConsts)
	SPEED_BUFF_STATUS_IDS = [
		STATUSES.THE_ARROW.id,
	]

	// Track history of speedmods
	_history = [{speedmod: 1, start: 0, end: Infinity}]

	_activePartywideSpeedBuffFlags = 0
	_activeSpeedMap = JOB_SPEED_BUFF_TO_SPEEDMOD_MAP[0]

	// Override to handle extra logic during normalise, or to fill in _activeSpeedMap manually if not generating gauge-based buff events
	jobSpecificNormaliseLogic(/* event */) {
	}

	// Override for scalars that function outside of speedmod
	// NOTE: Only Riddle of Fire (MNK) and 3-stack Astral Fire/Umbral Ice (BLM) actually do this. Please use _activeSpeedMap for everything else
	getJobAdditionalSpeedbuffScalar() {
		return 1.0
	}

	recalcSpeedmodAndSaveHistory(event) {
		// Recalculate the speedmod and save to history
		const modifier = this._activeSpeedMap[this._activePartywideSpeedBuffFlags] ||
			this._activeSpeedMap[PARTYWIDE_SPEED_BUFF_FLAGS.NONE]

		this._history[this._history.length - 1].end = event.timestamp-1
		this._history.push({
			speedmod: (modifier / 100) * this.getJobAdditionalSpeedbuffScalar(),
			start: event.timestamp,
			end: Infinity,
		})
	}

	normalise(events) {
		const types = ['applybuff', 'removebuff']

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			this.jobSpecificNormaliseLogic(event)

			// Only care about certain events to the player
			if (
				!event.ability ||
				!types.includes(event.type) ||
				!this.SPEED_BUFF_STATUS_IDS.includes(event.ability.guid) ||
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

			this.recalcSpeedmodAndSaveHistory(event)
		}

		return events
	}

	get(timestamp = this.parser.currentTimestamp) {
		return this._history.find(h => h.start <= timestamp && h.end >= timestamp).speedmod
	}
}
