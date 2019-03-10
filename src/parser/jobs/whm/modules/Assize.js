import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Trans} from '@lingui/react'

const EXCUSED_HOLD_DEFAULT = 1500 //time allowed to hold it every time it's off cd
const WARN_TARGET_PERCENT = 0.9 //percentage as a decimal for warning tier on checklist

// 4.5: Assize CD changed from 60s to 45s
const PRE45_ASSIZE_COOLDOWN = 60

export default class Assize extends Module {
	static handle = 'assize'
	static dependencies = [
		'checklist',
		'downtime',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0
	_excusedHeld = 0

	ASSIZE_COOLDOWN = this.parser.patch.before('4.5')
		? PRE45_ASSIZE_COOLDOWN
		: ACTIONS.ASSIZE.cooldown

	constructor(...args) {
		super(...args)

		const _filter = {
			by: 'player',
			abilityId: [ACTIONS.ASSIZE.id],
		}
		this.addHook('cast', _filter, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		this._uses++
		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		const firstOpportunity = (this._lastUse + this.ASSIZE_COOLDOWN * 1000)
		const _held = event.timestamp - firstOpportunity
		if (_held > 0) {
			//get downtimes in the period we're holding the cooldown
			const downtimes = this.downtime.getDowntimeWindows(firstOpportunity, firstOpportunity + EXCUSED_HOLD_DEFAULT)
			const firstEnd = downtimes.length ? downtimes[0].end : firstOpportunity
			this._totalHeld += _held
			this._excusedHeld += EXCUSED_HOLD_DEFAULT + (firstEnd - firstOpportunity)
		}
		//update the last use
		this._lastUse = event.timestamp
	}

	_onComplete() {
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration: this._totalHeld
		const _usesMissed = Math.floor((holdDuration - this._excusedHeld)/ (this.ASSIZE_COOLDOWN * 1000))
		const maxUsesInt = this._uses + _usesMissed
		const warnTarget = 100 * Math.floor(WARN_TARGET_PERCENT * maxUsesInt) / maxUsesInt
		this.checklist.add(new TieredRule({
			name: 'Use Assize Frequently',
			description: <Trans id="whm.assize.checklist.description"> Frequent use of <ActionLink {...ACTIONS.ASSIZE} /> is typically a DPS gain and helps with MP management. </Trans>,
			tiers: {[warnTarget]: TARGET.WARN, 95: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="whm.assize.checklist.requirement.assize.name"><ActionLink {...ACTIONS.ASSIZE} /> uses </Trans>,
					value: this._uses,
					target: Math.max(maxUsesInt, this._uses),
				}),
			],
		}))
	}
}
