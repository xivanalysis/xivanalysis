import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class DarkArts extends Module {
	static handle = 'darkarts'
	static title = 'Dark Arts Management'
	static dependencies = [
		'library',
		'buffs',
		'gcds',
		'suggestions',
		'combatants',
	]

	// counters (uncombo'd GCDs ignored)
	_countDA = 0 // Dark Arts
	_countDroppedDA = 0 //dropped dark arts
	_countDAPS = 0  // Dark Arts Power Slash    (3 in hate chain, better hate mod than 2).
	_countDASS = 0  // Dark Arts Spinning Slash (2 in hate chain)
	_countDADP = 0  // Dark Arts Dark Passenger (no slashing bonus, slightly worse than DA other abilities)
	// dark arts
	_darkArtsApplicationTime = -1

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onApplyDarkArts)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onRemoveDarkArts)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		if (this.buffs.darkArtsActive() && this.library.DARK_ARTS_CONSUMERS.includes(abilityId)) {
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
		}
	}

	_onApplyDarkArts(event) {
		if (event.timestamp === this.parser.fight.start_time) {
			//opener DA put in with a fabricated event
			this._darkArtsOpener = true
		}
		this._countDA += 1
		this._darkArtsApplicationTime = event.timestamp
	}

	_onRemoveDarkArts(event) {
		// see if we have recorded a DA appliation
		if (this._darkArtsApplicationTime !== undefined) {
			// check if DA was consumed by an action, increment DA tally if so
			if (this._darkArtsApplicationTime - event.timestamp >= this.library.DARK_ARTS_DURATION) {
				// buff fell off
				this._countDroppedDA += 1
			}
			// else buff was consumed
			//reset timer
			this._darkArtsApplicationTime = undefined
		}
	}

	_onComplete() {
		if (this._countDroppedDA > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_ARTS.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.DARK_ARTS}/> applications expired.  Hopefully this was caused by a downtime transition, otherwise there are more serious problems (4/5 GCD, most oGCDs consume DA.)
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You missed out on {this._countDroppedDA * 140} potency due to {this._countDroppedDA} dropped DAs.
				</Fragment>,
			}))
		}
		if (this._countDADP > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_PASSENGER.icon,
				content: <Fragment>
					Try to avoid using <ActionLink {...ACTIONS.DARK_PASSENGER}/> with <ActionLink {...ACTIONS.DARK_ARTS}/> if possible.  It is a very powerful enmity tool, but does not benefit from <StatusLink id={STATUSES.SLASHING_RESISTANCE_DOWN.id}/>
					, and is a slight damage loss compared to the other options.  However, as it is one of the most powerful enmity tools in your arsenal, don't be scared to use it if needed.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					You missed out on {this._countDADP * 4} potency due to {this._countDADP} DADPs.
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
