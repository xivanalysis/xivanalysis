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

	_fangAndClaw = {
		casts: 0,
		removed: 0,
	}
	_wheelingThrust = {
		casts: 0,
		removed: 0,
	}
	_mirageDive = {
		casts: 0,
		removed: 0,
		overwritten: 0,
	}

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player', abilityId: ACTIONS.FANG_AND_CLAW.id}, this._onFangAndClaw)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.WHEELING_THRUST.id}, this._onWheelingThrust)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.MIRAGE_DIVE.id}, this._onMirageDive)
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.DIVE_READY.id}, this._onReadyOverwritten) // The other two can't be overwritten due to how they drop
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.SHARPER_FANG_AND_CLAW.id}, this._onSharperRemoved)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.ENHANCED_WHEELING_THRUST.id}, this._onEnhancedRemoved)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DIVE_READY.id}, this._onReadyRemoved)
		this.addHook('complete', this._onComplete)
	}

	// For all of our cast/removal tracking, we only want to know if it happened outside of downtime to avoid errant penalization.
	// The only one that doesn't need the check is overwriting Mirage Dive, since you can't get a proc from an invulnerable target.
	_onFangAndClaw(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._fangAndClaw.casts++
		}
	}

	_onWheelingThrust(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._wheelingThrust.casts++
		}
	}

	_onMirageDive(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._mirageDive.casts++
		}
	}

	_onReadyOverwritten() {
		this._mirageDive.overwritten++
	}

	_onSharperRemoved(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._fangAndClaw.removed++
		}
	}

	_onEnhancedRemoved(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._wheelingThrust.removed++
		}
	}

	_onReadyRemoved(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._mirageDive.removed++
		}
	}

	_onComplete() {
		const droppedFang = this._fangAndClaw.removed - this._fangAndClaw.casts
		const droppedWheeling = this._wheelingThrust.removed - this._wheelingThrust.casts
		const droppedMirage = this._mirageDive.removed - this._mirageDive.casts

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FANG_AND_CLAW.icon,
			content: <Trans id="drg.procs.suggestions.fang.content">
				Avoid interrupting your combos at the <ActionLink {...ACTIONS.FANG_AND_CLAW}/> stage, as it causes you to lose your <StatusLink {...STATUSES.SHARPER_FANG_AND_CLAW}/> proc, costing you a cast and the <ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> duration that comes with it.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: droppedFang,
			why: <Trans id="drg.procs.suggestions.fang.why">
				You dropped <Plural value={droppedFang} one="# Fang and Claw proc" other="# Fang and Claw procs"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.WHEELING_THRUST.icon,
			content: <Trans id="drg.procs.suggestions.wheeling.content">
				Avoid interrupting your combos at the <ActionLink {...ACTIONS.WHEELING_THRUST}/> stage, as it causes you to lose your <StatusLink {...STATUSES.ENHANCED_WHEELING_THRUST}/> proc, costing you a cast and the <ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> duration that comes with it.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: droppedWheeling,
			why: <Trans id="drg.procs.suggestions.wheeling.why">
				You dropped <Plural value={droppedWheeling} one="# Wheeling Thrust proc" other="# Wheeling Thrust procs"/>.
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
				You dropped <Plural value={droppedWheeling} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MIRAGE_DIVE.icon,
			content: <Trans id="drg.procs.suggestions.mirage-overwritten.content">
				Avoid casting <ActionLink {...ACTIONS.JUMP.id}/> and <ActionLink {...ACTIONS.SPINESHATTER_DIVE.id}/> when you already have a <StatusLink {...STATUSES.DIVE_READY}/> procs, as it overwrites them and can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._mirageDive.overwritten,
			why: <Trans id="drg.procs.suggestions.mirage-overwritten.why">
				You overwrote <Plural value={this._mirageDive.overwritten} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
			</Trans>,
		}))
	}
}
