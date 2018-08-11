import React, {Fragment} from 'react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {PROCS, SEVERITY_MISSED_PROCS, SEVERITY_OVERWRITTEN_PROCS, SEVERITY_INVULN_PROCS} from 'parser/jobs/rdm/ProcsEnum'
import {i18nMark} from '@lingui/react'

const IMPACT_OVERRIDE_THRESHOLD = 8000

export default class Procs extends Module {
	static handle = 'procs'
	static title = 'Procs'
	static dependencies = [
		'downtime',
		'suggestions',
	]
	static i18n_id = i18nMark('rdm.procs.title')

	_history = {}
	_castStateMap = {
		[STATUSES.VERSTONE_READY.id]: ACTIONS.VERSTONE,
		[STATUSES.VERFIRE_READY.id]: ACTIONS.VERFIRE,
		[STATUSES.IMPACTFUL.id]: ACTIONS.IMPACT,
		[STATUSES.ENHANCED_SCATTER.id]: ACTIONS.SCATTER,
	}
	_doNotCastMap = {
		[STATUSES.VERSTONE_READY.id]: ACTIONS.VERAREO,
		[STATUSES.VERFIRE_READY.id]: ACTIONS.VERTHUNDER,
		[STATUSES.IMPACTFUL.id]: ACTIONS.JOLT_II,
	}
	//Global timestamp tracking per Proc
	_currentProcs = {}
	_castState = null
	_impactfulProcOverride = false
	_previousCast = null
	_bossWasInvuln = false

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {
			to: 'player',
			abilityId: PROCS,
		}, this._onGain)
		this.addHook('removebuff', {
			to: 'player',
			abilityId: PROCS,
		}, this._onRemove)
		this.addHook('refreshbuff', {
			to: 'player',
			abilityId: PROCS,
		}, this._onRefresh)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		const invuln = this.downtime.getDowntime(this._previousCast||0, event.timestamp)
		this._previousCast = event.timestamp
		this._bossWasInvuln = invuln > 0

		// Debug
		// if (abilityID in ACTIONS) {
		// 	console.log(`Ability: ${ACTIONS[abilityID].name} Timestamp: ${event.timestamp}`)
		// }

		if (abilityID === ACTIONS.IMPACT.id && this._currentProcs[STATUSES.IMPACTFUL.id]) {
			const impactRemainingDuration = event.timestamp - (this._currentProcs[STATUSES.IMPACTFUL.id] || 0)
			if (impactRemainingDuration <= IMPACT_OVERRIDE_THRESHOLD) {
				//Use Impactful at 8 or less seconds remaining, regardless of all other procs
				this._impactfulProcOverride = true
			}
		}

		this._castState = abilityID
	}

	_onGain(event) {
		const statusID = event.ability.guid
		// Debug
		// console.log(`Gain Status: ${STATUSES[statusID].name} Timestamp: ${event.timestamp}`)

		//Initialize if not present
		if (!(statusID in this._history)) {
			this._history[statusID] = {
				overWritten: 0,
				invuln: 0,
				missed: 0,
				wasted: 0,
			}
		}

		if (!(statusID in this._currentProcs)) {
			this._currentProcs[statusID] = 0
		}

		this._currentProcs[statusID] = event.timestamp
	}

	_onRefresh(event) {
		const statusID = event.ability.guid
		// Debug
		// console.log(`Refresh Status: ${STATUSES[statusID].name} Timestamp: ${event.timestamp}`)

		if (this._currentProcs[statusID] > 0 && !this._impactfulProcOverride && statusID !== STATUSES.ENHANCED_SCATTER.id) {
			this._history[statusID].overWritten++
		}

		this._currentProcs[statusID] = event.timestamp
	}

	_onRemove(event) {
		const statusID = event.ability.guid

		// Debug
		// console.log(`Remove Status: ${STATUSES[statusID].name} Timestamp: ${event.timestamp}`)

		if (this._bossWasInvuln) {
			this._history[statusID].invuln++
		} else if (this._castState !== this._castStateMap[statusID].id) {
			this._history[statusID].missed++
		}

		if (statusID === STATUSES.IMPACTFUL.id) {
			this._impactfulProcOverride = false
		}

		if (this._castState === this._castStateMap[statusID].id) {
		//Reset this statusID!
			this._currentProcs[statusID] = 0
		}
	}

	_onComplete() {
		for (const statusID in this._history) {
			//Leaving here for future debug purposes.
			//const util = require('util')
			// console.log(statusID)
			// console.log(STATUSES[statusID].name)
			// console.log(util.inspect(this._history[statusID], {showHidden: true, depth: null}))
			this.generateSuggestions(statusID)
		}
	}

	generateSuggestions(statusID) {
		if (this._history[statusID].missed) {
			this.suggestions.add(new TieredSuggestion({
				icon: this._castStateMap[statusID].icon,
				why: `${this._history[statusID].missed} ${this._castStateMap[statusID].name}${this._history[statusID].missed !== 1 ? 's' : ''} casts missed due to buff falling off`,
				content: <Fragment>
					Try to use <ActionLink {...this._castStateMap[statusID]}/> whenever <StatusLink {...STATUSES[statusID]}/> is up to avoid losing out on mana gains
				</Fragment>,
				tiers: SEVERITY_MISSED_PROCS,
				value: this._history[statusID].missed,
			}))
		}

		if (this._history[statusID].overWritten) {
			this.suggestions.add(new TieredSuggestion({
				icon: this._castStateMap[statusID].icon,
				why: `${this._history[statusID].overWritten} ${this._castStateMap[statusID].name}${this._history[statusID].overWritten !== 1 ? 's' : ''} Procs Overwritten due to casting ${this._doNotCastMap[statusID].name} when ${this._castStateMap[statusID].name} ready is up`,
				content: <Fragment>
					Don't cast <ActionLink {...this._doNotCastMap[statusID]}/> when you have <StatusLink {...STATUSES[statusID]}/> up
				</Fragment>,
				tiers: SEVERITY_OVERWRITTEN_PROCS,
				value: this._history[statusID].overWritten,
			}))
		}

		if (this._history[statusID].invuln) {
			this.suggestions.add(new TieredSuggestion({
				icon: this._castStateMap[statusID].icon,
				why: `${this._history[statusID].invuln} ${this._castStateMap[statusID].name}${this._history[statusID].invuln !== 1 ? 's' : ''} Procs used on a boss while the boss was invulnerable`,
				content: <Fragment>
					Try to use <ActionLink {...this._castStateMap[statusID]}/> whenever <StatusLink {...STATUSES[statusID]}/> is up, but not while the boss is invulnerable
				</Fragment>,
				tiers: SEVERITY_INVULN_PROCS,
				value: this._history[statusID].invuln,
			}))
		}
	}
}
