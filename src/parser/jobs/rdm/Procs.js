import React, {Fragment} from 'react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {CAST_STATE, PROCS, SEVERITY_MISSED_PROCS, SEVERITY_OVERWRITTEN_PROCS, SEVERITY_INVULN_PROCS} from 'parser/jobs/rdm/ProcsEnum'
import {i18nMark} from '@lingui/react'

export default class Procs extends Module {
	static handle = 'procs'
	static title = 'Procs'
	static dependencies = [
		'downtime',
		'suggestions',
	]
	static i18n_id = i18nMark('rdm.procs.title')

	_history = {
		wastedStone: 0,
		overWrittenStone: 0,
		invulnStone: 0,
		missedStone: 0,
		wastedFire: 0,
		overWrittenFire: 0,
		invulnFire: 0,
		missedFire: 0,
		wastedImpactful: 0,
		overWrittenImpactful: 0,
		invulnImpactful: 0,
		missedImpactful: 0,
		wastedEnhancedScatters: 0,
		invulnScatter: 0,
		missedScatter: 0,
	}
	_currentProcs = {
		verStoneGained: 0,
		verFireGained: 0,
		impactfulGained: 0,
		enhancedScatterGained: 0,
	}
	_castState = CAST_STATE.NA
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
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		const invuln = this.downtime.getDowntime(this._previousCast||0, event.timestamp)
		this._previousCast = event.timestamp
		this._bossWasInvuln = invuln > 0

		switch (abilityID) {
		case ACTIONS.IMPACT.id:
			this._castState = CAST_STATE.IMPACT
			const impactRemainingDuration = event.timestamp - this._currentProcs.impactfulGained
			if (impactRemainingDuration <= 8000) {
				//Use Impactful at 8 or less seconds remaining, regardless of all other procs
				this._impactfulProcOverride = true
			}
			break
		case ACTIONS.VERSTONE.id:
			this._castState = CAST_STATE.VERSTONE
			break
		case ACTIONS.VERFIRE.id:
			this._castState = CAST_STATE.VERFIRE
			break
		case ACTIONS.VERTHUNDER.id:
			this._castState = CAST_STATE.VERTHUNDER
			break
		case ACTIONS.VERAREO.id:
			this._castState = CAST_STATE.VERAREO
			break
		case ACTIONS.SCATTER.id:
			this._castState = CAST_STATE.SCATTER
			break
		default:
			this._castState = CAST_STATE.NA
			break
		}
	}

	_onGain(event) {
		const statusID = event.ability.guid

		switch (statusID) {
		case STATUSES.VERSTONE_READY.id:
			if (this._currentProcs.verStoneGained > 0 && !this._impactfulProcOverride) {
				//Wasted!
				this._history.overWrittenStone++
			}
			this._currentProcs.verStoneGained = event.timestamp
			break
		case STATUSES.VERFIRE_READY.id:
			if (this._currentProcs.verFireGained > 0 && !this._impactfulProcOverride) {
				//Wasted!
				this._history.overWrittenFire++
			}
			this._currentProcs.verFireGained = event.timestamp
			break
		case STATUSES.IMPACTFUL.id:
			if (this._currentProcs.impactfulGained > 0) {
				//Wasted!
				this._history.overWrittenImpactful++
			}
			this._currentProcs.impactfulGained = event.timestamp
			break
		case STATUSES.ENHANCED_SCATTER.id:
		//Impossible to waste this one on gain
			this._currentProcs.enhancedScatterGained = event.timestamp
			break
		default:
		//Nothing to see here
			break
		}
	}

	_onRemove(event) {
		const statusID = event.ability.guid

		switch (statusID) {
		case STATUSES.VERSTONE_READY.id:
			if (this._bossWasInvuln) {
				this._history.invulnStone++
			} else if (this._castState !== CAST_STATE.VERSTONE) {
				this._history.missedStone++
			}
			break
		case STATUSES.VERFIRE_READY.id:
			if (this._bossWasInvuln) {
				this._history.invulnFire++
			} else if (this._castState !== CAST_STATE.VERFIRE) {
				this._history.missedFire++
			}
			break
		case STATUSES.IMPACTFUL.id:
			if (this._bossWasInvuln) {
				this._history.invulnImpactful++
			} else if (this._castState !== CAST_STATE.IMPACT) {
				this._history.missedImpactful++
			}
			break
		case STATUSES.ENHANCED_SCATTER.id:
			if (this._bossWasInvuln) {
				this._currentProcs.invulnScatter++
			} else if (this._castState !== CAST_STATE.SCATTER) {
				this._history.missedScatter++
			}
			break
		default:
		//Nothing to see here
			break
		}
	}

	_onComplete() {
		this.verifyVerStone()
		this.verifyVerFire()
		this.verifyImpactful()
		this.verifyScatter()
	}

	verifyVerStone() {
		if (this._history.missedStone) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERSTONE.icon,
				why: `${this._history.missedStone} Verstone${this._history.missedStone !== 1 ? 's' : ''} casts missed due to buff falling off`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.VERSTONE}/> whenever <StatusLink {...STATUSES.VERSTONE_READY}/> is up to avoid losing out on mana gains
				</Fragment>,
				tiers: SEVERITY_MISSED_PROCS,
				value: this._history.missedStone,
			}))
		}

		if (this._history.overWrittenStone) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERSTONE.icon,
				why: `${this._history.overWrittenStone} Verstone${this._history.overWrittenStone !== 1 ? 's' : ''} Procs Overwritten due to casting Verareo when VerStone ready is up`,
				content: <Fragment>
					Don't cast <ActionLink {...ACTIONS.VERAREO}/> when you have <StatusLink {...STATUSES.VERSTONE_READY}/> up
				</Fragment>,
				tiers: SEVERITY_OVERWRITTEN_PROCS,
				value: this._history.overWrittenStone,
			}))
		}

		if (this._history.invulnStone) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERSTONE.icon,
				why: `${this._history.invulnStone} Verstone${this._history.invulnStone !== 1 ? 's' : ''} Procs used on a boss while the boss was invulnerable`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.VERSTONE}/> whenever <StatusLink {...STATUSES.VERSTONE_READY}/> is up, but not while the boss is invulnerable
				</Fragment>,
				tiers: SEVERITY_INVULN_PROCS,
				value: this._history.invulnStone,
			}))
		}
	}

	verifyVerFire() {
		if (this._history.missedFire) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERFIRE.icon,
				why: `${this._history.missedFire} Verfire${this._history.missedFire !== 1 ? 's' : ''} casts missed due to buff falling off`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.VERFIRE}/> whenever <StatusLink {...STATUSES.VERFIRE_READY}/> is up to avoid losing out on mana gains
				</Fragment>,
				tiers: SEVERITY_MISSED_PROCS,
				value: this._history.missedFire,
			}))
		}

		if (this._history.overWrittenFire) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERFIRE.icon,
				why: `${this._history.overWrittenFire} Verfire${this._history.overWrittenFire !== 1 ? 's' : ''} Procs Overwritten due to casting Verthunder when Verfire ready is up`,
				content: <Fragment>
					Don't cast <ActionLink {...ACTIONS.VERTHUNDER}/> when you have <StatusLink {...STATUSES.VERFIRE_READY}/> up
				</Fragment>,
				tiers: SEVERITY_OVERWRITTEN_PROCS,
				value: this._history.overWrittenFire,
			}))
		}

		if (this._history.invulnFire) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERFIRE.icon,
				why: `${this._history.invulnFire} Verfire${this._history.invulnFire !== 1 ? 's' : ''} Procs used on a boss while the boss was invulnerable`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.VERFIRE}/> whenever <StatusLink {...STATUSES.VERFIRE_READY}/> is up, but not while the boss is invulnerable
				</Fragment>,
				tiers: SEVERITY_INVULN_PROCS,
				value: this._history.invulnFire,
			}))
		}
	}

	verifyImpactful() {
		if (this._history.missedImpactful) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.IMPACT.icon,
				why: `${this._history.missedImpactful} Impact${this._history.missedImpactful !== 1 ? 's' : ''} casts missed due to buff falling off`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.IMPACT}/> whenever <StatusLink {...STATUSES.IMPACTFUL}/> is up to avoid losing out on mana gains
				</Fragment>,
				tiers: SEVERITY_MISSED_PROCS,
				value: this._history.missedImpactful,
			}))
		}

		if (this._history.overWrittenFire) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.IMPACT.icon,
				why: `${this._history.overWrittenFire} Impact${this._history.overWrittenFire !== 1 ? 's' : ''} procs overwritten due to casting <ActionLink Jolt II when Impactful is up`,
				content: <Fragment>
					Don't cast <ActionLink {...ACTIONS.JOLT_II}/> when you have <StatusLink {...STATUSES.IMPACTFUL}/> up
				</Fragment>,
				tiers: SEVERITY_OVERWRITTEN_PROCS,
				value: this._history.overWrittenFire,
			}))
		}

		if (this._history.invulnImpactful) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.IMPACT.icon,
				why: `${this._history.invulnImpactful} Impact${this._history.invulnImpactful !== 1 ? 's' : ''} procs used on a boss while the boss was invulnerable`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.IMPACT}/> whenever <StatusLink {...STATUSES.IMPACTFUL}/> is up, but not while the boss is invulnerable
				</Fragment>,
				tiers: SEVERITY_INVULN_PROCS,
				value: this._history.invulnImpactful,
			}))
		}
	}

	verifyScatter() {
		if (this._history.missedScatter) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SCATTER.icon,
				why: `${this._history.missedScatter} Scatter${this._history.missedScatter !== 1 ? 's' : ''} procs missed due to buff falling off`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.SCATTER}/> whenever <StatusLink {...STATUSES.ENHANCED_SCATTER}/> is up to avoid losing out on mana gains,
					this applies even if only one target is left and the buff is up, since it yields 8|8 gains.
				</Fragment>,
				tiers: SEVERITY_MISSED_PROCS,
				value: this._history.missedScatter,
			}))
		}

		if (this._history.invulnScatter) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SCATTER.icon,
				why: `${this._history.invulnScatter} Scatter${this._history.invulnScatter !== 1 ? 's' : ''} procs used on a boss while the boss was invulnerable`,
				content: <Fragment>
					Try to use <ActionLink {...ACTIONS.SCATTER}/> whenever <StatusLink {...STATUSES.ENHANCED_SCATTER}/> is up, but not while the boss is invulnerable
				</Fragment>,
				tiers: SEVERITY_INVULN_PROCS,
				value: this._history.invulnScatter,
			}))
		}
	}
}
