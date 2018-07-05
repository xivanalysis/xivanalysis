import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

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

export default class Ruin4 extends Module {
	static handle = 'ruin4'
	static dependencies = [
		'cooldowns',
		'invuln',
		'suggestions',
	]
	static title = 'Ruin IV'

	_procChances = 0
	_procs = 0

	_lastProc = null
	_overage = 0

	on_cast_byPlayerPet(event) {
		if (!ACTIONS_NO_PROC.includes(event.ability.guid)) {
			this._procChances ++
		}
	}

	on_applybuff(event) {
		// Only care about further ruin
		if (event.ability.guid !== STATUSES.FURTHER_RUIN.id) { return }

		// Further Ruin (R4 proc) also reduces the CD on Enkindle by 10 seconds
		// TODO: Procs while buff is up don't refresh the buff... so I can't actually track reductions accurately. Should be OK as long as they're using their damn procs though.
		this.cooldowns.reduceCooldown(ACTIONS.ENKINDLE.id, 10)

		// TODO: Probably need to do more than this, but it'll do for now
		this._procs ++

		this._lastProc = event.timestamp
	}

	on_removebuff(event) {
		// Only care about further ruin
		if (event.ability.guid !== STATUSES.FURTHER_RUIN.id) { return }

		this._endProcHold(event.timestamp)
	}

	on_complete() {
		if (this._lastProc !== null) {
			this._endProcHold(this.parser.fight.end_time)
		}

		// console.log('wasted', this.overage)
		if (this._overage > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RUIN_IV.icon,
				content: <Fragment>
					Use <ActionLink {...ACTIONS.RUIN_IV}/> as soon as possible to avoid missing additional <StatusLink {...STATUSES.FURTHER_RUIN}/> procs.
				</Fragment>,
				severity: this._overage > 30000? SEVERITY.MAJOR : this._overage > 10000? SEVERITY.MEDIUM : SEVERITY.MINOR,
				why: `Further Ruin held for ${this.parser.formatDuration(this._overage)} longer than recommended over the course of the fight.`,
			}))
		}
	}

	_endProcHold(end) {
		const start = this._lastProc
		const untargetable = this.invuln.getUntargetableUptime('all', start, end)
		const holdTime = end - start - untargetable

		if (holdTime > MAX_PROC_HOLD) {
			this._overage += holdTime - MAX_PROC_HOLD
		}

		this._lastProc = null
	}

	output() {
		return <p>
			Chances: {this._procChances}<br/>
			Expected procs: {Math.floor(this._procChances * PROC_RATE)}<br/>
			Actual procs: {this._procs}
		</p>
	}
}
