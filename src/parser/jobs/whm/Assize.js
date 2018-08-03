import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Trans} from '@lingui/react'

export default class Assize extends Module {
	static handle = 'assize'
	static dependencies = [
		'checklist',
		'invuln',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0

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

		const _held = event.timestamp - this._lastUse - (ACTIONS.ASSIZE.cooldown * 1000)
		if (_held > 0) {
			this._totalHeld += _held
		}
		//update the last use
		this._lastUse = event.timestamp
	}

	_onComplete() {
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration: this._totalHeld
		const _usesMissed = Math.floor(10 * holdDuration / (ACTIONS.ASSIZE.cooldown * 1000)) / 10
		const maxUsesInt = this._uses + Math.floor(_usesMissed)
		const warnTarget = 100 * Math.floor(0.9 * maxUsesInt) / maxUsesInt
		this.checklist.add(new TieredRule({
			name: 'Use Assize Frequently',
			description: <Trans id="whm.assize.checklist.description"> Frequent use of <ActionLink {...ACTIONS.ASSIZE} /> is typically a DPS gain and helps with MP management. </Trans>,
			tiers: {[warnTarget]: TARGET.WARN, 95: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="whm.assize.checklist.description"><ActionLink {...ACTIONS.ASSIZE} /> uptime </Trans>,
					value: Math.floor(this._uses),
					target: maxUsesInt,
				}),
			],
		}))
	}
}
