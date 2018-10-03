/**
 * @author Yumiya
 */

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'

const SETUP_TIME = 3800
const SONG_MAX_DURATION = 30000
const DOT_INTERVAL = 3000
const ANIMATION_LOCK = 700

// For easy access
const THE_WANDERERS_MINUET = 0
const MAGES_BALLAD = 1
const ARMYS_PAEON = 2

export default class SongUsage extends Module {
	static handle = 'eightyboi'
	static dependencies = [
		'invuln',
		'downtime',
	]

	_debugEvents = []

	_lastDotTickTimestamp = 0
	_eightyBoiCasts = []
	_songList = [
		{
			action: ACTIONS.THE_WANDERERS_MINUET,
			totalCasts: 0,
			lastCast: undefined,
			timestamp: 0,
			get timeLeft() { return this.lastCast ? Math.max(SONG_MAX_DURATION - (this.timestamp - this.lastCast), 0) : 0 },
			// TODO: Define a better way of applying AP's reduction into WM's cooldown
			get cooldown() { return this.lastCast ? Math.max((this.totalCasts <= 1 ? this.action.cooldown*1000 : 67000) - (this.timestamp - this.lastCast), 0) : 0 },
		},
		{
			action: ACTIONS.MAGES_BALLAD,
			totalCasts: 0,
			lastCast: undefined,
			timestamp: 0,
			get timeLeft() { return this.lastCast ? Math.max(SONG_MAX_DURATION - (this.timestamp - this.lastCast), 0) : 0 },
			get cooldown() { return this.lastCast ? Math.max(this.action.cooldown*1000 - (this.timestamp - this.lastCast), 0) : 0 },
		},
		{
			action: ACTIONS.ARMYS_PAEON,
			totalCasts: 0,
			lastCast: undefined,
			timestamp: 0,
			get timeLeft() { return this.lastCast ? Math.max(SONG_MAX_DURATION - (this.timestamp - this.lastCast), 0) : 0 },
			get cooldown() { return this.lastCast ? Math.max(this.action.cooldown*1000 - (this.timestamp - this.lastCast), 0) : 0 },
		},
	]

	constructor(...args) {
		super(...args)

		this.addHook('damage', this._onDotTick)
		this.addHook('damage', this._setClosestEightyBoi)
		this.addHook('complete', this._onComplete)

	}

	_onDotTick(event) {
		if (event.tick && event.tick === true && event.timestamp !== this._lastDotTickTimestamp) {
			this._lastDotTickTimestamp = event.timestamp
		}
	}

	_setClosestEightyBoi(event) {

		this._songList.forEach(s => s.timestamp = event.timestamp)

		this._debugEvents.push(event)

		if (this._songList[THE_WANDERERS_MINUET].timeLeft === 0 && this._songList[MAGES_BALLAD].timeLeft === 0 && this._songList[ARMYS_PAEON].timeLeft === 0) {
			if (event.timestamp < this.parser.fight.start_time + SETUP_TIME) {
				return
			}
		}

		if (!this.invuln.isUntargetable()) {
			if ((this.parser.fight.end_time - event.timestamp < 30000 && this._songList[THE_WANDERERS_MINUET].cooldown <= 0)||(this._songList[THE_WANDERERS_MINUET].cooldown <= 0 && this._songList[MAGES_BALLAD].cooldown <= 30000 && this._songList[ARMYS_PAEON].cooldown <= 60000)) {

				this._castSong(THE_WANDERERS_MINUET)
				return
			}

			if (this._songList[THE_WANDERERS_MINUET].cooldown <= 50000 && this._songList[MAGES_BALLAD].cooldown <= 0 && this._songList[ARMYS_PAEON].cooldown <= 30000) {
				if (this._songList[THE_WANDERERS_MINUET].timeLeft < this._timeUntilNextDotTick() + ANIMATION_LOCK) {

					this._castSong(MAGES_BALLAD)
					return
				}
			}

			if (this._songList[THE_WANDERERS_MINUET].cooldown <= 30000 && this._songList[MAGES_BALLAD].cooldown <= 60000 && this._songList[ARMYS_PAEON].cooldown <= 0) {
				if (this._songList[MAGES_BALLAD].timeLeft < this._timeUntilNextDotTick()) {

					this._castSong(ARMYS_PAEON)
					return
				}
			}
		}
	}

	_onComplete() {
		for (let i = 0; i < this._eightyBoiCasts.length - 1; i++) {
			const cast = this._eightyBoiCasts[i]
			const nextCast = this._eightyBoiCasts[i+1]

			const songStart = cast.timestamp
			const songEnd = Math.min(cast.timestamp + SONG_MAX_DURATION, nextCast.timestamp)

			cast.uptime = songEnd - songStart - this.downtime.getDowntime(songStart, songEnd)
		}

		const lastCast = this._eightyBoiCasts[this._eightyBoiCasts.length - 1]

		const songStart = lastCast.timestamp
		const songEnd = Math.min(lastCast.timestamp + SONG_MAX_DURATION, this.parser.fight.end_time)

		lastCast.uptime = songEnd - songStart - this.downtime.getDowntime(songStart, songEnd)

	}

	_castSong(song) {

		this._songList[song].lastCast = this._songList[song].timestamp
		this._songList[song].totalCasts++

		this._eightyBoiCasts.push({
			action: this._songList[song].action,
			timestamp: this._songList[song].timestamp,
		})
	}

	_timeUntilNextDotTick() {
		return DOT_INTERVAL - (this.parser.currentTimestamp - this._lastDotTickTimestamp)
	}

	_formatList(list) {
		const formattedList = []

		list.forEach(e => {
			const fe = Object.assign({
				name: e.action.name,
				timestamp: this.parser.formatTimestamp(e.timestamp),
				uptime: e.uptime/1000,
			})
			formattedList.push(fe)
		})

		return formattedList

	}

	getClosestEightyBoi() {
		return this._eightyBoiCasts
	}

	getFormattedClosestEightyBoi() {
		return this._formatList(this.getClosestEightyBoi())
	}
}
