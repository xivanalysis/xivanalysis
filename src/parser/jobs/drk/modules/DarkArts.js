import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const DARK_ARTS_DURATION = 10000
const DARK_ARTS_MANA_POTENCY = 140
//const DARK_ARTS_MANA_COST = 2400

// actions that consume DA status
const DARK_ARTS_CONSUMERS = [
	ACTIONS.SYPHON_STRIKE.id,
	ACTIONS.SOULEATER.id,
	ACTIONS.SPINNING_SLASH.id,
	ACTIONS.POWER_SLASH.id,
	ACTIONS.DARK_PASSENGER.id,
	ACTIONS.PLUNGE.id,
	ACTIONS.ABYSSAL_DRAIN.id,
	ACTIONS.CARVE_AND_SPIT.id,
	ACTIONS.QUIETUS.id,
	ACTIONS.BLOODSPILLER.id,
]

export default class DarkArts extends Module {
	static handle = 'darkarts'
	static title = 'Dark Arts Management'
	static dependencies = [
		'buffs',
		'suggestions',
	]

	// counters (uncombo'd GCDs ignored)
	_countDA = 0 // Dark Arts
	_countOverwrittenDA = 0 //DAing when DA is up doesn't give you a double DA
	_countDroppedDA = 0 //dropped dark arts
	_countDAPS = 0  // Dark Arts Power Slash    (3 in hate chain, better hate mod than 2).
	_countDASS = 0  // Dark Arts Spinning Slash (2 in hate chain)
	_countDADP = 0  // Dark Arts Dark Passenger (no slashing bonus, slightly worse than DA other abilities)
	// dark arts
	_darkArtsApplicationTime = undefined

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onApplyDarkArts)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onRemoveDarkArts)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		if (this.buffs.darkArtsActive() && DARK_ARTS_CONSUMERS.includes(abilityId)) {
			// DA will be consumed and resolved, manually increment targeted counters
			if (abilityId === ACTIONS.DARK_PASSENGER.id) {
				this._countDADP += 1
			}
			if (abilityId === ACTIONS.SPINNING_SLASH.id) {
				this._countDASS += 1
			}
			if (abilityId === ACTIONS.POWER_SLASH.id) {
				this._countDAPS += 1
			}
			//mark the DA as consumed by resetting the timer
			this._darkArtsApplicationTime = undefined
		}
	}

	_onApplyDarkArts(event) {
		if (event.timestamp === this.parser.fight.start_time) {
			//opener DA put in with a fabricated event
			//this._darkArtsOpener = true
		}
		// check for overwritten DA
		if (this._darkArtsApplicationTime === undefined) {
			this._countDA += 1
		} else {
			//overwritten DA, good job buddy
			this._countOverwrittenDA += 1
		}
		//give a full duration DA. going to trigger some false positives for start of fight, but at least they tried
		this._darkArtsApplicationTime = event.timestamp
	}

	_onRemoveDarkArts(event) {
		// see if we have recorded a DA application, or haven't resolved it earlier
		if (this._darkArtsApplicationTime !== undefined) {
			// check if DA was consumed by an action, increment DA tally if so
			if (this._darkArtsApplicationTime - event.timestamp >= DARK_ARTS_DURATION) {
				// buff fell off
				this._countDroppedDA += 1
			}
			// else buff was consumed
			//reset timer
			this._darkArtsApplicationTime = undefined
		}
	}

	_onComplete() {
		if (this._countOverwrittenDA > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_ARTS.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.DARK_ARTS}/> applications was overwritten by a Dark Arts recast.  This is effectively the same as dropping a Dark Arts.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You missed out on {this._countDroppedDA * DARK_ARTS_MANA_POTENCY} potency due to {this._countOverwrittenDA} overwritten DAs.
				</Fragment>,
			}))
		}
		if (this._countDroppedDA > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_ARTS.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.DARK_ARTS}/> applications expired.  Hopefully this was caused by a downtime transition, otherwise there are more serious problems (4/5 GCD, most oGCDs consume DA.)
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You missed out on {this._countDroppedDA * DARK_ARTS_MANA_POTENCY} potency due to {this._countDroppedDA} dropped DAs.
				</Fragment>,
			}))
		}
		// the 14 potency is the 10% loss from not having slashing.  this has 0 use anywhere else and is basically only relevant if someone DAs every DP
		const DADPPotencyLossBecauseDPDoesntGetSlashing = 28
		if (this._countDADP > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_PASSENGER.icon,
				content: <Fragment>
					Try to avoid using <ActionLink {...ACTIONS.DARK_PASSENGER}/> with <ActionLink {...ACTIONS.DARK_ARTS}/> if possible.  It is a very powerful enmity tool, but does not benefit from <StatusLink id={STATUSES.SLASHING_RESISTANCE_DOWN.id}/>
					, and is a slight damage loss compared to the other options.  However, as it is one of the most powerful enmity tools in your arsenal, don't be scared to use it if needed.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					You missed out on {this._countDADP * DADPPotencyLossBecauseDPDoesntGetSlashing} potency due to {this._countDADP} DADPs.
				</Fragment>,
			}))
		}
		if (this._countDASS > this._countDAPS) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SPINNING_SLASH.icon,
				content: <Fragment>
					<ActionLink {...ACTIONS.DARK_ARTS}/> has a greater impact on total enmity when used with <ActionLink {...ACTIONS.POWER_SLASH}/> than <ActionLink {...ACTIONS.SPINNING_SLASH}/>.  Prioritize boosting either both or just Power Slash, otherwise you may be using too many enmity GCDs.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					You used <ActionLink {...ACTIONS.DARK_ARTS}/> <ActionLink {...ACTIONS.SPINNING_SLASH}/> {this._countDASS} times, but <ActionLink {...ACTIONS.DARK_ARTS}/> <ActionLink {...ACTIONS.POWER_SLASH}/> only {this._countDAPS} times.
				</Fragment>,
			}))
		}
	}

	output() {
		//
		return false
	}
}
