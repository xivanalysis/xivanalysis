//import {Trans, Plural} from '@lingui/react'
//import React from 'react'

//import {ActionLink, Trans} from 'components/ui/DbLink'
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

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player', abilityId: Object.keys(this._casts).map(Number)}, this._onCast)
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.FLOURISHING_FAN_DANCE.id}, this._onReadyOverwritten) //TODO: check how to tally all overwritten procs
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.FLOURISHING_CASCADE.id}, this._onReadyOverwritten)
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.FLOURISHING_FOUNTAIN.id}, this._onReadyOverwritten)
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.FLOURISHING_SHOWER.id}, this._onReadyOverwritten)
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.FLOURISHING_WINDMILL.id}, this._onReadyOverwritten)
		this.addHook('removebuff', {by: 'player', abilityId: Object.keys(this._removedProcs).map(Number)}, this._onProcRemoved)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._casts[event.ability.guid]++
		}
	}

	_onProcRemoved(event) {
		if (!this.downtime.isDowntime(event.timestamp)) {
			this._removedProcs[event.ability.guid]++
		}
	}
	//TODO: finish transition from drg to dnc
	_onComplete() { // tracking dropped procs
		const droppedFan_Dance = this._removedProcs[STATUSES.FLOURISHING_FAN_DANCE.id] - this._casts[ACTIONS.FAN_DANCE_III.id]
		const droppedCascade = this._removedProcs[STATUSES.FLOURISHING_CASCADE.id] - this._casts[ACTIONS.REVERSE_CASCADE.id]
		const droppedFountain = this._removedProcs[STATUSES.FLOURISHING_FOUNTAIN.id] - this._casts[ACTIONS.FOUNTAINFALL.id]
		const droppedShower = this._removedProcs[STATUSES.FLOURISHING_SHOWER.id] - this._casts[ACTIONS.BLOODSHOWER.id]
		const droppedWindmill = this._removedProcs[STATUSES.FLOURISHING_WINDMILL.id] - this._casts[ACTIONS.RISING_WINDMILL.id]

		this.suggestions.add(new TieredSuggestion({ //dropped procs
			icon: ACTIONS.FOUNTAINFALL.icon,
			//		content: <Trans id="drg.procs.suggestions.extenders.content"> {/*?*/}
			//				Avoid interrupting your combos at the <ActionLink {...ACTIONS.FANG_AND_CLAW}/> and <ActionLink {...ACTIONS.WHEELING_THRUST}/> stages, as it causes you to lose the procs that allow you to cast them, costing you both the cast and the <ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> duration that comes with it.
			//		</Trans>,
			tiers: {
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: droppedCascade + droppedFan_Dance + droppedShower + droppedFountain + droppedWindmill,
			//			why: <Trans id="drg.procs.suggestions.extenders.why">
			//				You dropped <Plural value={droppedFang} one="# Fang and Claw proc" other="# Fang and Claw procs"/> and <Plural value={droppedWheeling} one="# Wheeling Thrust proc" other="# Wheeling Thrust procs"/>.
			//			</Trans>,
		}))

		//	this.suggestions.add(new TieredSuggestion({ //overriding
		//		icon: ACTIONS.REVERSE_CASCADE.icon,
		//		content: <Trans id="drg.procs.suggestions.mirage-dropped.content">
		//		Avoid letting your <StatusLink {...STATUSES.DIVE_READY}/> procs fall off, as it can delay your Life of the Dragon windows and potentially cost you a lot of DPS.
		//		</Trans>,
		//		tiers: {
		//		2: SEVERITY.MEDIUM,
		//		3: SEVERITY.MAJOR,
		//		},
		//		value: , //take total of overwritten
		//		why: <Trans id="drg.procs.suggestions.mirage-dropped.why">
		//		You dropped <Plural value={droppedMirage} one="# Mirage Dive proc" other="# Mirage Dive procs"/>.
		//		</Trans>,
		//	}))

	}

}
