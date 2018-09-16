/**
 * @author Yumiya
 */

//import React, {Fragment} from 'react'
//import {StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from '../../core/Module'
//import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

//const SETUP_TIME = 4000
const SONG_MAX_DURATION = 30000

export default class SongUsage extends Module {
	static handle = 'songusage'
	static dependencies = [
		'eightyboi',
		'downtime',
	]

	_wmCastEvents = []
	_mbCastEvents = []
	_apCastEvents = []

	_wmCount = 0
	_mbCount = 0
	_apCount = 0

	_lastDotTickTimestamp = 0
	_songCastEvents = []
	_deathEvents = []

	_uptimeBlocks = []

	_eightyBoiCasts = []

	_songList = [
		{
			action: ACTIONS.THE_WANDERERS_MINUET,
			totalCasts: 0,
			lastCast: undefined,
			timestamp: 0,
			get timeLeft() { return this.lastCast ? Math.max(SONG_MAX_DURATION - (this.timestamp - this.lastCast), 0) : 0 },
			get cooldown() { return this.lastCast ? Math.max(this.action.cooldown*1000 - (this.timestamp - this.lastCast), 0) : 0 },
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

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.THE_WANDERERS_MINUET.id, ACTIONS.MAGES_BALLAD.id, ACTIONS.ARMYS_PAEON.id],
		}, this._onSongCast)
		this.addHook('death', {
			to: 'player',
		}, this._onDeath)
		this.addHook('complete', this._onComplete)

	}

	_onSongCast(event) {
		const actionId = event.ability.guid
		switch (actionId) {
		case ACTIONS.THE_WANDERERS_MINUET.id:
			this._wmCastEvents.push(event)
			this._wmCount += 1
			break
		case ACTIONS.MAGES_BALLAD.id:
			this._mbCastEvents.push(event)
			this._mbCount += 1
			break
		case ACTIONS.ARMYS_PAEON.id:
			this._apCastEvents.push(event)
			this._apCount += 1
			break
		default:
			break
		}
		this._songCastEvents.push(event)
	}

	_onDeath(event) {
		this._deathEvents.push(event)
	}

	_onComplete() {

		//const fightDuration = (this.parser.fightDuration - this.downtime.getDowntime())/1000
		this._setUptimeBlocks()
		console.log('Fitted EightyBoi:')
		console.log(this.eightyboi.getFormattedClosestEightyBoi())
		console.log('Actual casts:')
		console.log(this._formatSongList(this._songCastEvents))
		//this._findIdealSongOrder()
	}

	_setUptimeBlocks() {

		const downtimes = this.downtime.getDowntimes()

		// Determines the first block of uptime
		const firstBlock = {
			start: this.parser.fight.start_time,
			end:  downtimes && downtimes.length > 0 ? downtimes[0].start : this.parser.fight.end_time,
			get duration() { return this.end - this.start },
		}

		this._uptimeBlocks.push(firstBlock)

		// If there's no downtime, uptime is the whole fight
		if (!downtimes || downtimes.length <= 0) {
			return
		}

		for (let i = 0; i < downtimes.length; i++) {

			const block = {
				start: downtimes[i].end,
				end:  i !== downtimes.length - 1 ? downtimes[i+1].start : this.parser.fight.end_time,
				get duration() { return this.end - this.start },
			}

			this._uptimeBlocks.push(block)
		}

		// debug
		const _formattedUptimeBlocks = []
		this._uptimeBlocks.forEach(block => {
			const formattedBlock = {
				start: this.parser.formatTimestamp(block.start),
				end: this.parser.formatTimestamp(block.end),
			}
			_formattedUptimeBlocks.push(formattedBlock)
		})
		console.log('Uptime blocks:')
		console.log(_formattedUptimeBlocks)

	}

	_getSongCastsInBlock(block) {

		return this._songCastEvents.filter((c) => c.timestamp <= block.end && c.timestamp >= block.start)

	}

	_getSongCastBeforeBlock(block) {

		const reversedCasts = []

		for (let i = this._songCastEvents.length - 1; i >= 0; i--) {
			reversedCasts.push(this._songCastEvents[i])
		}

		return reversedCasts.find(c => c.timestamp < block.start)

	}

	_findIdealSongOrder(block, nextBlock, songCasts, previousSong) {

		const isSongStillUp = previousSong ? previousSong.timestamp + 30000 > block.start : false
		//let isAPExtension = false

		const adjustedBlock = Object.assign(block)

		if (isSongStillUp) {
			console.log('Song still up!')
		}

		let expectedCastsInBlock = this._getExpectedCastsInBlock(adjustedBlock)

		// If the last cast in a block is supposedly WM, checks if it's not worth extending AP
		if (this._expectedLastCastInBlockId(expectedCastsInBlock) === ACTIONS.THE_WANDERERS_MINUET.id) {
			const timeWasted = Math.min(30000 - (block.duration % 80000), this._getDowntimeBetweenBlocks(block, nextBlock))

			// TODO: Determine threshold
			if (timeWasted > 10000) {
				// WE'RE EXTENDING BOIS
				//isAPExtension = true
				expectedCastsInBlock -= 1
			}
		}

	}

	_getExpectedCastsInBlock(block) {
		let castsCount = 0
		let blockDuration = block.duration

		for (let i = 0; blockDuration >= 0; i++) {
			switch (i % 3) {
			case 0:
			case 1:
				blockDuration -= 30000
				castsCount += 1
				break
			case 2:
				blockDuration -= 20000
				castsCount += 1
				break
			default:
				break
			}
		}

		return castsCount

	}

	_getDowntimeBetweenBlocks(block1, block2) {
		return block2 ? block2.start - block1.end : this.parser.fight.end_time - block1.end
	}

	_expectedLastCastInBlockId(expectedCastsInBlock) {
		switch ((expectedCastsInBlock - 1) % 3) {
		case 0:
			return ACTIONS.THE_WANDERERS_MINUET.id
		case 1:
			return ACTIONS.MAGES_BALLAD.id
		case 2:
			return ACTIONS.ARMYS_PAEON.id
		default:
			return undefined
		}
	}

	_formatSongList(eventList) {

		const formattedList = []

		for (let i = 0; i < eventList.length; i++) {
			const event = eventList[i]
			const nextEvent = i < eventList.length - 1 ? eventList[i + 1] : undefined

			const songStart = event.timestamp
			const songEnd = Math.min(event.timestamp + SONG_MAX_DURATION, nextEvent ? nextEvent.timestamp : this.parser.fight.end_time)

			formattedList.push(Object.assign({
				name: event.ability.guid === ACTIONS.THE_WANDERERS_MINUET.id ? ACTIONS.THE_WANDERERS_MINUET.name : event.ability.guid === ACTIONS.MAGES_BALLAD.id ? ACTIONS.MAGES_BALLAD.name : ACTIONS.ARMYS_PAEON.name,
				timestamp: this.parser.formatTimestamp(event.timestamp),
				uptime: (songEnd - songStart - this.downtime.getDowntime(songStart, songEnd))/1000,
			}))
		}

		return formattedList

	}
}
