import React, {Fragment} from 'react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {PROCS, SEVERITY_MISSED_PROCS, SEVERITY_OVERWRITTEN_PROCS, SEVERITY_INVULN_PROCS} from 'parser/jobs/rdm/modules/ProcsEnum'
import {i18nMark, Trans, Plural} from '@lingui/react'

const IMPACT_OVERRIDE_THRESHOLD = 8000

export default class Procs extends Module {
	static handle = 'procs'
	static title = 'Proc Issues'
	static dependencies = [
		'downtime',
		'invuln',
		'suggestions',
		'enemies',
	]
	static i18n_id = i18nMark('rdm.procs.title')

	_history = {}
	_invulnCasts = []
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
	_targetWasInvuln = false
	_playerWasInDowntime = false
	_lastTargetID = 0

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
		this._initializeHistory()
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		const downtime = this.downtime.getDowntime(this._previousCast||0, event.timestamp)
		this._previousCast = event.timestamp
		this._playerWasInDowntime = downtime > 0
		this._targetWasInvuln = this.invuln.isInvulnerable(event.targetID, event.timestamp)
		this._lastTargetID = event.targetID

		if (abilityID === ACTIONS.IMPACT.id && this._currentProcs[STATUSES.IMPACTFUL.id]) {
			const impactRemainingDuration = event.timestamp - (this._currentProcs[STATUSES.IMPACTFUL.id] || 0)
			if (impactRemainingDuration <= IMPACT_OVERRIDE_THRESHOLD) {
				//Use Impactful at 8 or less seconds remaining, regardless of all other procs
				this._impactfulProcOverride = true
			}
		}

		this._castState = abilityID
	}

	_initializeHistory() {
		if (!(STATUSES.VERFIRE_READY in this._history)) {
			this._history[STATUSES.VERFIRE_READY.id] = {
				overWritten: 0,
				invuln: 0,
				missed: 0,
				wasted: 0,
			}
		}

		if (!(STATUSES.VERSTONE_READY in this._history)) {
			this._history[STATUSES.VERSTONE_READY.id] = {
				overWritten: 0,
				invuln: 0,
				missed: 0,
				wasted: 0,
			}
		}

		if (!(STATUSES.IMPACTFUL in this._history)) {
			this._history[STATUSES.IMPACTFUL.id] = {
				overWritten: 0,
				invuln: 0,
				missed: 0,
				wasted: 0,
			}
		}
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
		const timestamp = event.timestamp
		const gcdTimeDiff = event.timestamp - this.parser.fight.start_time
		//const lastTargetName = this.enemies.getEntity(this._lastTargetID)
		// Debug
		// console.log(`Remove Status: ${STATUSES[statusID].name} Timestamp: ${event.timestamp}`)

		if (this._targetWasInvuln) {
			// Debug
			//console.log(`spell: ${this._castStateMap[statusID].name}, rawstamp: ${event.timestamp}, formatStamp: ${this.parser.formatTimestamp(event.timestamp)}`)
			this._history[statusID].invuln++
			// const util = require('util')
			// console.log(util.inspect(event, {showHidden: true, depth: null}))
			//console.log(this.parser.formatTimestamp(timestamp))
			let lastTargetName = 'Unavailable'
			const lastTarget = this.enemies.getEntity(this._lastTargetID)
			if (lastTarget) {
				lastTargetName = lastTarget.name
			}
			const invulnEvent = {
				statusID,
				gcdTimeDiff,
				timestamp,
				lastTargetName,
			}
			this._invulnCasts.push(invulnEvent)
		} else if (this._castState !== this._castStateMap[statusID].id && !this._playerWasInDowntime) {
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
		const missedFire = this._history[STATUSES.VERFIRE_READY.id].missed||0
		const invulnFire = this._history[STATUSES.VERFIRE_READY.id].invuln||0
		const overWrittenFire = this._history[STATUSES.VERFIRE_READY.id].overWritten||0
		const missedStone = this._history[STATUSES.VERSTONE_READY.id].missed||0
		const invulnStone = this._history[STATUSES.VERSTONE_READY.id].invuln||0
		const overWrittenStone = this._history[STATUSES.VERSTONE_READY.id].overWritten||0
		const missedImpact = this._history[STATUSES.IMPACTFUL.id].missed||0
		const invulnImpact = this._history[STATUSES.IMPACTFUL.id].invuln||0
		const overWrittenImpact = this._history[STATUSES.IMPACTFUL.id].overWritten||0

		//Icons always default to the White Mana spell if black/jolt spells don't have more bad items.
		//TODO I need to figure out a good way of excluding items that evaluated to 0 in the condensed groups.
		//TODO Maybe I should just build a function to return the properly setup Content and Why.
		//Fire/Stone are identical but Impact has some extra rules, so for Missed and overwrite it has its own suggestion generation
		this.suggestions.add(new TieredSuggestion({
			icon: missedFire > missedStone ? ACTIONS.VERFIRE.icon : ACTIONS.VERSTONE.icon,
			content: <Trans id="rdm.procs.suggestions.missed.content">
					Try to use <ActionLink {...ACTIONS.VERFIRE} /> whenever you have <StatusLink {...STATUSES.VERFIRE_READY} /> or <ActionLink {...ACTIONS.VERSTONE} /> whenever you have <StatusLink {...STATUSES.VERSTONE_READY} /> to avoid losing out on mana gains
			</Trans>,
			tiers: SEVERITY_MISSED_PROCS,
			value: missedFire + missedStone,
			why: <Trans id="rdm.procs.suggestions.missed.why">
					You missed <Plural value={missedFire} one="# Verfire proc" other="# Verfire procs" />, and <Plural value={missedStone} one="# Verstone proc" other="# Verstone procs" />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.IMPACT.icon,
			content: <Trans id="rdm.procs.suggestions.impact.missed.content">
					Try to use <ActionLink {...ACTIONS.IMPACT} /> whenever you have <StatusLink {...STATUSES.IMPACTFUL} /> to avoid losing out on mana gains, even if you will overwrite <StatusLink {...STATUSES.VERFIRE_READY} /> or <StatusLink {...STATUSES.VERSTONE_READY} /> with your Dualcast
			</Trans>,
			tiers: SEVERITY_MISSED_PROCS,
			value: missedImpact,
			why: <Trans id="rdm.procs.suggestions.impact.missed.why">
					You missed <Plural value={missedImpact} one="# Impact proc" other="# Impact procs" />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: overWrittenFire > overWrittenStone ? ACTIONS.VERFIRE.icon : ACTIONS.VERSTONE.icon,
			content: <Trans id="rdm.procs.suggestions.overwritten.content">
				Don't cast <ActionLink {...ACTIONS.VERTHUNDER} /> when you have <StatusLink {...STATUSES.VERFIRE_READY} /> available or <ActionLink {...ACTIONS.VERAREO} /> when you have <StatusLink {...STATUSES.VERSTONE_READY} /> available
			</Trans>,
			tiers: SEVERITY_OVERWRITTEN_PROCS,
			value: overWrittenFire + overWrittenStone,
			why: <Trans id="rdm.procs.suggestions.overwritten.why">
				<Plural value={overWrittenFire} one="# Verfire proc" other="# Verfire procs" />, and <Plural value={overWrittenStone} one="# Verstone proc" other="# Verstone procs" /> were lost due to being overwritten.  This excludes procs overwritten from a forced use of <ActionLink {...ACTIONS.IMPACT} />
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.IMPACT.icon,
			content: <Trans id="rdm.procs.suggestions.impact.overwritten.content">
				Don't cast <ActionLink {...ACTIONS.JOLT_II} /> when you have <StatusLink {...STATUSES.IMPACTFUL} /> available
			</Trans>,
			tiers: SEVERITY_OVERWRITTEN_PROCS,
			value: overWrittenImpact,
			why: <Trans id="rdm.procs.suggestions.impact.overwritten.why">
				<Plural value={overWrittenImpact} one="# Impact proc" other="# Impact procs" /> were lost due to being overwritten.
			</Trans>,
		}))

		//Invuln is the same for all 3, so condense Impact in with Fire and Stone
		this.suggestions.add(new TieredSuggestion({
			icon: invulnImpact > invulnFire + invulnStone ? ACTIONS.IMPACT.icon : invulnFire > invulnStone ? ACTIONS.VERFIRE.icon : ACTIONS.VERSTONE.icon,
			content: <Trans id="rdm.procs.suggestions.invuln.content">
					Try not to use <ActionLink {...ACTIONS.IMPACT}/>, <ActionLink {...ACTIONS.VERFIRE}/>, and <ActionLink {...ACTIONS.VERSTONE} /> while the boss is invulnerable
			</Trans>,
			tiers: SEVERITY_INVULN_PROCS,
			value: invulnFire + invulnStone + invulnImpact,
			why: <Trans id="rdm.procs.suggestions.invuln.why">
					You used <Plural value={invulnImpact} one="# Impact proc" other="# Impact procs" />, <Plural value={invulnFire} one="# Verfire proc" other="# Verfire procs" />, and <Plural value={invulnStone} one="# Verstone proc" other="# Verstone procs" /> on an invulnerable boss.
			</Trans>,
		}))
	}

	output() {
		const invulnEvents = this._invulnCasts
		if (invulnEvents.length === 0) {
			return false
		}

		//Currently we only care about Invuln points in time, this has been requested quite often in The Balance from RDMs looking over their logs
		return <Fragment>
			<Trans id="rdm.procs.invulnlist.preface">
				Each of the bullets below is the chronological order of procs wasted on an invulnerable boss
			</Trans>
			<ul>
				{invulnEvents.map(item => <li key={item.timestamp}>
					<strong>{this.parser.formatTimestamp(item.timestamp)}</strong>:&nbsp;
					{this._castStateMap[item.statusID].name}&nbsp;-&nbsp;<strong><Trans id="rdm.procs.invuln.target">Target</Trans></strong>:&nbsp;{item.lastTargetName}
				</li>)}
			</ul>
		</Fragment>
	}
}
