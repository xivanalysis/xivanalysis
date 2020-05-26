/**
 * @author Yumiya
 */

import React, {Fragment} from 'react'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const SETUP_TIME = 3200 // Assuming song being used after second GCD (2.50s from first GCD + 0.70s from second GCD animation lock)
const SONG_DURATION = 30000

const TIER = {
	MAJOR: 15,
	MEDIUM: 10,
}

export default class SongUptime extends Module {
	static handle = 'songuptime'
	static dependencies = [
		'suggestions',
		'downtime',
		'util',
	]

	_songCastEvents = []
	_deathEvents = []

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.THE_WANDERERS_MINUET.id, ACTIONS.MAGES_BALLAD.id, ACTIONS.ARMYS_PAEON.id],
		}, this._onSongCast)
		this.addEventHook('death', {
			to: 'player',
		}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	_onSongCast(event) {
		this._songCastEvents.push(event)
	}

	_onDeath(event) {
		this._deathEvents.push(event)
	}

	_onComplete() {
		const songlessTime = this.util.formatDecimal(this._getSonglessTime())
		const songlessTolerance = this.util.formatDecimal(this._getTolerance())

		if (songlessTime > songlessTolerance) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.THE_WANDERERS_MINUET.icon,
				tiers: {
					[songlessTolerance + TIER.MAJOR]: SEVERITY.MAJOR,
					[songlessTolerance + TIER.MEDIUM]: SEVERITY.MEDIUM,
					0: SEVERITY.MINOR,
				},
				value: songlessTime,
				why: <Fragment>
					You were songless for {songlessTime} seconds.
				</Fragment>,
				content: <Fragment>
					Try not to be songless during uptime. Bard's core mechanics revolve around its songs and the added effects they bring.
				</Fragment>,
			}))
		}
	}

	_getSonglessTime() {

		let totalSonglessTime = 0

		// Iterate through each song cast
		for (let i = 0; i < this._songCastEvents.length; i++) {

			// Timestamps for songless period to be determined
			const songless = {start: 0, end: 0}

			// If this is the last song cast in the encounter, caster is songless until the end of encounter, otherwise songless until the next song is cast
			if (i === this._songCastEvents.length - 1) {
				songless.end = this.parser.fight.end_time
			} else {
				songless.end = this._songCastEvents[i+1].timestamp
			}

			// The start of a songless period can't be after the end of said period, so it's the minimum between the end of first song and end of assumed songless period
			songless.start = Math.min(this._songCastEvents[i].timestamp + SONG_DURATION, songless.end)

			// If caster died after first song was cast
			const deathEvent = this._deathEvents.find(d => d.timestamp > this._songCastEvents[i].timestamp)

			// If death was before the theoretical songless period
			if (deathEvent ? deathEvent.timestamp < songless.start : false) {
				// Then death marks the start of the songless period
				songless.start = deathEvent.timestamp
			}

			// Just in case it's negative, but it shouldn't be given the previous logic
			const theoreticalSonglessTime =  Math.max(songless.end - songless.start, 0)

			// If there's songless time between two songs, subtracts the amount of time the target was invulnerable during that interval
			if (theoreticalSonglessTime > 0) {
				const effectiveSonglessTime = Math.max(theoreticalSonglessTime - this.downtime.getDowntime(songless.start, songless.end), 0)
				totalSonglessTime += effectiveSonglessTime
			}
		}

		return totalSonglessTime / 1000
	}

	_getTolerance() {
		// For each song, if the end of the song fell into a downtime, next song will require a set-up time
		// This set-up time is added to the tolerance
		let tolerance = SETUP_TIME

		this._songCastEvents.forEach(c => {
			if (this.downtime.isDowntime(c.timestamp + SONG_DURATION)) {
				tolerance += SETUP_TIME
			}
		})

		return tolerance / 1000
	}
}
