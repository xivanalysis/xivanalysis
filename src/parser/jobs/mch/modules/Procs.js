import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const ACTION_PROCS = {
	[ACTIONS.SLUG_SHOT.id]: STATUSES.ENHANCED_SLUG_SHOT.id,
	[ACTIONS.HEATED_SLUG_SHOT.id]: STATUSES.ENHANCED_SLUG_SHOT.id,
	[ACTIONS.CLEAN_SHOT.id]: STATUSES.CLEANER_SHOT.id,
	[ACTIONS.HEATED_CLEAN_SHOT.id]: STATUSES.CLEANER_SHOT.id,
}

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'downtime',
		'suggestions',
	]

	_activeProcs = {
		[STATUSES.ENHANCED_SLUG_SHOT.id]: false,
		[STATUSES.CLEANER_SHOT.id]: false,
	}

	_noProcShots = 0
	_overwrittenProcs = 0
	_droppedProcs = 0

	constructor(...args) {
		super(...args)

		const shotFilter = {by: 'player', abilityId: Object.keys(ACTION_PROCS).map(Number)}
		const buffFilter = {by: 'player', abilityId: Object.keys(this._activeProcs).map(Number)}

		this.addHook('cast', shotFilter, this._onShot)
		this.addHook('applybuff', buffFilter, this._onProcGained)
		this.addHook('refreshbuff', buffFilter, this._onProcOverwritten)
		this.addHook('removebuff', buffFilter, this._onProcLost)
		this.addHook('complete', this._onComplete)
	}

	_onShot(event) {
		const relevantProc = ACTION_PROCS[event.ability.guid]
		if (!this._activeProcs[relevantProc]) {
			// They used a proc shot without the proc
			this._noProcShots++
		}

		// Clear the flag unconditionally in case it was set
		this._activeProcs[relevantProc] = false
	}

	_onProcGained(event) {
		this._activeProcs[event.ability.guid] = true
	}

	_onProcOverwritten() {
		this._overwrittenProcs++
	}

	_onProcLost(event) {
		const abilityId = event.ability.guid
		if (this._activeProcs[abilityId] && !this.downtime.isDowntime(event.timestamp)) {
			// The proc fell off naturally rather than being consumed by a shot
			this._droppedProcs++
		}

		this._activeProcs[abilityId] = false
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HEATED_SLUG_SHOT.icon,
			content: <Trans id="mch.procs.suggestions.missing.content">
				Avoid using <ActionLink {...ACTIONS.SLUG_SHOT}/> and <ActionLink {...ACTIONS.CLEAN_SHOT}/> when you don't have procs for them, as they do less damage than any of your other GCDs without procs.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._noProcShots,
			why: <Trans id="mch.procs.suggestions.missing.why">
				You used <Plural value={this._noProcShots} one="# action" other="# actions"/> without a proc.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HEATED_SLUG_SHOT.icon,
			content: <Trans id="mch.procs.suggestions.overwritten.content">
				Avoid using <ActionLink {...ACTIONS.SPLIT_SHOT}/> and <ActionLink {...ACTIONS.SLUG_SHOT}/> when you already have the procs they produce active, particularly if it expends ammo. It's always better to spend the proc first.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._overwrittenProcs,
			why: <Trans id="mch.procs.suggestions.overwritten.why">
				You overwrote <Plural value={this._overwrittenProcs} one="# proc" other="# procs"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HEATED_SLUG_SHOT.icon,
			content: <Trans id="mch.procs.suggestions.dropped.content">
				Avoid letting your <StatusLink {...STATUSES.ENHANCED_SLUG_SHOT}/> and <StatusLink {...STATUSES.CLEANER_SHOT}/> procs to fall off whenever possible, as they're worth a significant amount of potency.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._droppedProcs,
			why: <Trans id="mch.procs.suggestions.dropped.why">
				You let <Plural value={this._droppedProcs} one="# proc" other="# procs"/> fall off.
			</Trans>,
		}))
	}
}
