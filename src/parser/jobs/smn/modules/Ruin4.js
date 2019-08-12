import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

// there's also the case where if you have further ruin and an egi is about to do gcd + ogcd and they held, that can be considered a no no
// also if they are holding further ruin during Bahamut what are they even doing
// that one is major as hell
// if we consider one pet gcd cycle, that's generally going to be 1-2 player gcds
// which is an acceptable tolerance
// ....................->...........PetAction procs FurtherRuin ->...........PetAction procs FurtherRuin ->
// 	previousGCD -> (further ruin procs) Ruin 4 -> R2 + weave(+ weave) -> GCD
// Even if the player used r4 early hoping to get another for the r2 weave, it was impossible because the pet's cycle couldn't allow it, the next proc window was after the r2 cast(edited)

const ACTIONS_NO_PROC = [
	ACTIONS.TITAN_EGI_ATTACK.id,
	ACTIONS.IFRIT_EGI_ATTACK.id,
]
const PROC_RATE = 0.15

const MAX_PROC_HOLD = 5000

// Severity in ms
const OVERAGE_SEVERITY = {
	1000: SEVERITY.MINOR,
	10000: SEVERITY.MEDIUM,
	30000: SEVERITY.MAJOR,
}

export default class Ruin4 extends Module {
	static handle = 'ruin4'
	static dependencies = [
		'downtime',
		'suggestions',
	]
	static title = t('smn.ruin-iv.title')`Ruin IV`
	static displayOrder = DISPLAY_ORDER.RUIN_IV

	_procChances = 0
	_procs = 0

	_lastProc = null
	_overage = 0

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'pet'}, this._onPetCast)

		const frFilter = {
			to: 'player',
			abilityId: STATUSES.FURTHER_RUIN.id,
		}
		this.addHook('applybuff', frFilter, this._onApplyFurtherRuin)
		this.addHook('removebuff', frFilter, this._onRemoveFurtherRuin)

		this.addHook('complete', this._onComplete)
	}

	_onPetCast(event) {
		if (!ACTIONS_NO_PROC.includes(event.ability.guid)) {
			this._procChances ++
		}
	}

	_onApplyFurtherRuin(event) {
		// TODO: Probably need to do more than this, but it'll do for now
		this._procs ++

		this._lastProc = event.timestamp
	}

	_onRemoveFurtherRuin(event) {
		this._endProcHold(event.timestamp)
	}

	_onComplete() {
		if (this._lastProc !== null) {
			this._endProcHold(this.parser.fight.end_time)
		}

		if (this._overage > 1000) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.RUIN_IV.icon,
				tiers: OVERAGE_SEVERITY,
				value: this._overage,
				content: <Trans id="smn.ruin-iv.suggestions.overage.content">
					Use <ActionLink {...ACTIONS.RUIN_IV}/> as soon as possible to avoid missing additional <StatusLink {...STATUSES.FURTHER_RUIN}/> procs.
				</Trans>,
				why: <Trans id="smn.ruin-iv.suggestions.overage.why">
					Further Ruin held for {this.parser.formatDuration(this._overage)} longer than recommended over the course of the fight.
				</Trans>,
			}))
		}
	}

	_endProcHold(end) {
		const start = this._lastProc
		const untargetable = this.downtime.getDowntime(start, end)
		const holdTime = end - start - untargetable

		if (holdTime > MAX_PROC_HOLD) {
			this._overage += holdTime - MAX_PROC_HOLD
		}

		this._lastProc = null
	}

	output() {
		return <p>
			<Trans id="smn.ruin-iv.chances">Chances: {this._procChances}</Trans><br/>
			<Trans id="smn.ruin-iv.expected-procs">Expected procs: {Math.floor(this._procChances * PROC_RATE)}</Trans><br/>
			<Trans id="smn.ruin-iv.actual-procs">Actual procs: {this._procs}</Trans>
		</p>
	}
}
