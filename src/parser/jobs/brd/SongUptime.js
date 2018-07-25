import React, {Fragment} from 'react'

import {StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class SongUptime extends Module {
	static handle = 'songuptime'
	static dependencies = [
		'checklist',
		'cooldowns',
		'enemies',
		'suggestions',
		'invuln',
		'downtime',
	]

	_wmCounter = 0
	_mbCounter = 0
	_apCounter = 0

	_songCastEvents = []
	_invulnerableEvents = []


	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.THE_WANDERERS_MINUET.id, ACTIONS.MAGES_BALLAD.id, ACTIONS.ARMYS_PAEON.id],
		}, this._onCastSong)
		this.addHook('complete', this._onComplete)
	}

	_onCastSong(event) {
		const actionId = event.ability.guid
		switch (actionId) {
		case ACTIONS.THE_WANDERERS_MINUET.id:
			this._wmCounter += 1
			break
		case ACTIONS.MAGES_BALLAD.id:
			this._mbCounter += 1
			break
		case ACTIONS.ARMYS_PAEON.id:
			this._apCounter += 1
			break
		default:
			break
		}
		this._songCastEvents.push(event)
	}

	_onComplete() {

		const fightDuration = (this.parser.fightDuration - this.downtime.getDowntime())/1000
		const songlessTime = (this._getSonglessTime())/1000
		const songlessPercentile = (songlessTime/fightDuration)*100

		//TODO: Define a threshold for song uptime
		if (songlessPercentile > 5) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THE_WANDERERS_MINUET.icon,
				why: `Being songless for ${songlessTime} seconds (${songlessPercentile}%)`,
				severity: songlessPercentile > 15 ? SEVERITY.MAJOR : songlessPercentile > 10? SEVERITY.MEDIUM : SEVERITY.MINOR,
				content: <Fragment>
					Try not to be songless during uptime. Bard's core mechanics revolve around its songs and the added effects they bring. Your songs also apply a <StatusLink {...STATUSES.CRITICAL_UP}/> buff to your party.
				</Fragment>,
			}))
		}
	}

	_getSonglessTime() {

		let totalSonglessTime = 0

		// Iterate through each song cast, except the last one

		for (let i = 0; i < this._songCastEvents.length; i++) {

			const songlessStart = this._songCastEvents[i].timestamp + 30000
			let songlessEnd = 0

			// If this is the last song cast in the encounter, caster is songless until the end of encounter
			if (i === this._songCastEvents.length - 1) {
				songlessEnd = this.parser.fight.end_time
			} else {
				songlessEnd = this._songCastEvents[i+1].timestamp
			}

			const timeBetweenSongs =  Math.max(songlessEnd - songlessStart, 0)

			// If there's songless time between two songs, subtracts the amount of time the target was invulnerable during that interval
			if (timeBetweenSongs > 0) {
				const timeSongless = Math.max(timeBetweenSongs - this.downtime.getDowntime(songlessStart, songlessEnd), 0)
				totalSonglessTime += timeSongless
			}
		}

		return totalSonglessTime
	}

	// Method for debug purposes. Converts a timestamp into a time in seconds relative to the start of the encounter
	_formatTimestamp(timestamp) {
		return (timestamp - this.parser.fight.start_time)/1000
	}
}
