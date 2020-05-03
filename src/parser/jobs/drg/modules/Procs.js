import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
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

	_casts = {
		[ACTIONS.FANG_AND_CLAW.id]: 0,
		[ACTIONS.WHEELING_THRUST.id]: 0,
		[ACTIONS.MIRAGE_DIVE.id]: 0,
	}
	_removedProcs = {
		[STATUSES.SHARPER_FANG_AND_CLAW.id]: 0,
		[STATUSES.ENHANCED_WHEELING_THRUST.id]: 0,
		[STATUSES.DIVE_READY.id]: 0,
	}
	_overwrittenDiveReady = 0

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {by: 'player', abilityId: Object.keys(this._casts).map(Number)}, this._onCast)
		this.addEventHook('refreshbuff', {by: 'player', abilityId: STATUSES.DIVE_READY.id}, this._onReadyOverwritten) // The other two can't be overwritten due to how they drop
		this.addEventHook('removebuff', {by: 'player', abilityId: Object.keys(this._removedProcs).map(Number)}, this._onProcRemoved)
		this.addEventHook('complete', this._onComplete)
	}

	// For all of our cast/removal tracking, we only want to know if it happened outside of downtime to avoid errant penalization.
	// The only one that doesn't need the check is overwriting Mirage Dive, since you can't get a proc from an invulnerable target.
	_onCast(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._casts[event.ability.guid]++
		}
	}

	_onReadyOverwritten() {
		this._overwrittenDiveReady++
	}

	_onProcRemoved(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._removedProcs[event.ability.guid]++
		}
	}

	_onComplete() {
		const droppedFang = this._removedProcs[STATUSES.SHARPER_FANG_AND_CLAW.id] - this._casts[ACTIONS.FANG_AND_CLAW.id]
		const droppedWheeling = this._removedProcs[STATUSES.ENHANCED_WHEELING_THRUST.id] - this._casts[ACTIONS.WHEELING_THRUST.id]
		const droppedMirage = this._removedProcs[STATUSES.DIVE_READY.id] - this._casts[ACTIONS.MIRAGE_DIVE.id]

		this.suggestions.add(new TieredSuggestion({
			icon: droppedFang >= droppedWheeling ? ACTIONS.FANG_AND_CLAW.icon : ACTIONS.WHEELING_THRUST.icon,
			content: <Trans id="drg.procs.suggestions.extenders.content">
				Avoid interrupting your combos at the <ActionLink {...ACTIONS.FANG_AND_CLAW}/> and <ActionLink {...ACTIONS.WHEELING_THRUST}/> stages, as it causes you to lose the procs that allow you to cast them, costing you both the cast and the <ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> duration that comes with it.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: droppedFang + droppedWheeling,
			why: <Trans id="drg.procs.suggestions.extenders.why">
				You dropped <Plural value={droppedFang} one="# Fang and Claw proc" other="# Fang and Claw procs"/> and <Plural value={droppedWheeling} one="# Wheeling Thrust proc" other="# Wheeling Thrust procs"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MIRAGE_DIVE.icon,
			content: <Trans id="drg.procs.suggestions.mirage-dropped.content">
				Avoid letting your <StatusLink {...STATUSES.DIVE_READY}/> procs fall off, as it can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: droppedMirage,
			why: <Trans id="drg.procs.suggestions.mirage-dropped.why">
				You dropped <Plural value={droppedMirage} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MIRAGE_DIVE.icon,
			content: <Trans id="drg.procs.suggestions.mirage-overwritten.content">
				Avoid casting <ActionLink {...ACTIONS.JUMP}/> and <ActionLink {...ACTIONS.SPINESHATTER_DIVE}/> when you already have a <StatusLink {...STATUSES.DIVE_READY}/> procs, as it overwrites them and can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._overwrittenDiveReady,
			why: <Trans id="drg.procs.suggestions.mirage-overwritten.why">
				You overwrote <Plural value={this._overwrittenDiveReady} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
			</Trans>,
		}))
	}
}
