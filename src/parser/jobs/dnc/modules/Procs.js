import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'downtime',
		'suggestions',
	]

	_casts = { //the listing order is arbitrary
		[ACTIONS.FAN_DANCE_III.id]: 0,
		[ACTIONS.REVERSE_CASCADE.id]: 0,
		[ACTIONS.FOUNTAINFALL.id]: 0,
		[ACTIONS.BLOODSHOWER.id]: 0,
		[ACTIONS.RISING_WINDMILL.id]: 0,
	}
	_removedProcs = {
		[STATUSES.FLOURISHING_FAN_DANCE.id]: 0,
		[STATUSES.FLOURISHING_CASCADE.id]: 0,
		[STATUSES.FLOURISHING_FOUNTAIN.id]: 0,
		[STATUSES.FLOURISHING_SHOWER.id]: 0,
		[STATUSES.FLOURISHING_WINDMILL.id]: 0,
	}

	_overwrittenProcs = 0
	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player', abilityId: Object.keys(this._casts).map(Number)}, this._onCast)
		this.addHook('refreshbuff', {by: 'player', abilityId: Object.keys(this._removedProcs).map(Number)}, this._procOverwritten)
		this.addHook('removebuff', {by: 'player', abilityId: Object.keys(this._removedProcs).map(Number)}, this._onProcRemoved)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._casts[event.ability.guid]++
		}
	}
	_procOverwritten() {
		this._overwrittenProcs++
	}
	_onProcRemoved(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._removedProcs[event.ability.guid]++
		}
	}

	_onComplete() { // tracking dropped procs
		const droppedFan_Dance = this._removedProcs[STATUSES.FLOURISHING_FAN_DANCE.id] - this._casts[ACTIONS.FAN_DANCE_III.id]
		const droppedCascade = this._removedProcs[STATUSES.FLOURISHING_CASCADE.id] - this._casts[ACTIONS.REVERSE_CASCADE.id]
		const droppedFountain = this._removedProcs[STATUSES.FLOURISHING_FOUNTAIN.id] - this._casts[ACTIONS.FOUNTAINFALL.id]
		const droppedShower = this._removedProcs[STATUSES.FLOURISHING_SHOWER.id] - this._casts[ACTIONS.BLOODSHOWER.id]
		const droppedWindmill = this._removedProcs[STATUSES.FLOURISHING_WINDMILL.id] - this._casts[ACTIONS.RISING_WINDMILL.id]
		const droppedProcs = droppedWindmill + droppedShower + droppedFan_Dance + droppedCascade + droppedFountain
		this.suggestions.add(new TieredSuggestion({ //dropped procs
			icon: ACTIONS.FOUNTAINFALL.icon,
			content: <Trans id="dnc.procs.suggestions.drops.content">
				Avoid dropping your procs unless absolutely necessary, as doing so leads to a DPS loss unless under very specific circumstances. If you have to drop one to keep your Esprit from overcapping, <ActionLink {...ACTIONS.RISING_WINDMILL} /> will lose the least DPS overall.
			</Trans>,
			why: <Trans id="dnc.procs.suggestions.drops.why">
				You dropped <Plural value={droppedProcs} one="# proc" other="# procs"/>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: droppedProcs,
		}))

		this.suggestions.add(new TieredSuggestion({ //overriding
			icon: ACTIONS.REVERSE_CASCADE.icon,
			content: <Trans id="dnc.procs.suggestions.overwrite.content">
				Avoid overwriting your procs. Your proc actions are stronger than your normal combo, so overwriting them is a significant DPS loss.
			</Trans>,
			why: <Trans id="dnc.procs.suggestions.overwrite.why">
							You overwrote <Plural value={this._overwrittenProcs} one="# proc" other="# procs"/>
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._overwrittenProcs,
		}))

	}

}
