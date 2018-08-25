import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

// TODO: Figure out how to check CD of Draw before Sleeve Draw is cast

// Amount of time it's okay to hold off Sleeve Draw (SD)
const EXCUSED_HOLD_DEFAULT = 1500

export default class Draw extends Module {
	static handle = 'sleeve draw'
	static dependencies = [
		'checklist',
		'unableToAct',
	]

	_uses = 0
	_lastUse = 0
	_totalHeld = 0
	_excusedHeld = 0

	constructor(...args) {
		super(...args)

		const _filter = {
			by: 'player',
			abilityId: [ACTIONS.SLEEVE_DRAW.id],
		}
		this.addHook('cast', _filter, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		this._uses++
		if (this._lastUse === 0) {
			this._lastUse = this.parser.fight.start_time
		}

		const firstOpportunity = this._lastUse + ACTIONS.SLEEVE_DRAW.cooldown*1000
		const _held = event.timestamp - firstOpportunity
		if (_held > 0) {
			const downtimes = this.unableToAct.getDowntimes(firstOpportunity, firstOpportunity + EXCUSED_HOLD_DEFAULT)
			const firstEnd = downtimes.length ? downtimes[0].end : firstOpportunity
			this._totalHeld += _held
			this._excusedHeld += EXCUSED_HOLD_DEFAULT + (firstEnd - firstOpportunity)
		}

		this._lastUse = event.timestamp
	}

	_onComplete() {
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		const _usesMissed = Math.floor((holdDuration - this._excusedHeld) / (ACTIONS.ASSIZE.cooldown * 1000))
		const maxUses = this._uses + _usesMissed

		this.checklist.add(new Rule({
			name: <Fragment>Use <ActionLink {...ACTIONS.SLEEVE_DRAW} /> Frequently</Fragment>,
			description: 'Cards are the bread and butter of the Astrologian, so we want to use them as frequently as possible. Sleeve Draw gives us more cards',
			requirements: [
				new Requirement({
					name: <Fragment>Use <ActionLink {...ACTIONS.SLEEVE_DRAW} /> Frequently</Fragment>,
					value: this._uses,
					target: Math.max(maxUses, this._uses),
				}),
			],
		}))
	}
}
