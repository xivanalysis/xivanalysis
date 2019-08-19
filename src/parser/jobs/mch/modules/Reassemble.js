import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

// The values in this const will be added to the bad use count as they're cast (hence Drill/Anchor being 0)
const REASSEMBLE_GCDS = {
	[ACTIONS.HEATED_SPLIT_SHOT.id]: 1,
	[ACTIONS.HEATED_SLUG_SHOT.id]: 1,
	[ACTIONS.HEATED_CLEAN_SHOT.id]: 1,
	[ACTIONS.HEAT_BLAST.id]: 1,
	[ACTIONS.AUTO_CROSSBOW.id]: 1,
	[ACTIONS.DRILL.id]: 0,
	[ACTIONS.BIOBLASTER.id]: 1,
	[ACTIONS.AIR_ANCHOR.id]: 0,
}

export default class Reassemble extends Module {
	static handle = 'reassemble'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_badReassembles = 0
	_droppedReassembles = 0
	_lastConsumption = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(REASSEMBLE_GCDS).map(Number)}, this._onCast)
		this.addHook('removedebuff', {by: 'player', abilityId: STATUSES.REASSEMBLED.id}, this._onRemoveReassemble)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		if (this.combatants.selected.hasStatus(STATUSES.REASSEMBLED.id)) {
			this._badReassembles += REASSEMBLE_GCDS[event.ability.guid]
			this._lastConsumption = event.timestamp
		}
	}

	_onRemoveReassemble(event) {
		if (event.timestamp !== this._lastConsumption) {
			this._droppedReassembles++
		}
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.bad-gcds.content">
				On single targets, <ActionLink {...ACTIONS.REASSEMBLE}/> should only ever be used on <ActionLink {...ACTIONS.DRILL}/> and <ActionLink {...ACTIONS.AIR_ANCHOR}/>, as they're your strongest GCDs by a large margin.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this._badReassembles,
			why: <Trans id="mch.reassemble.suggestions.bad-gcds.why">
				You used Reassemble on a non-optimal GCD <Plural value={this._badReassembles} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.dropped.content">
				Avoid using <ActionLink {...ACTIONS.REASSEMBLE}/> when a boss is about to go untargetable so you don't waste the buff.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this._droppedReassembles,
			why: <Trans id="mch.reassemble.suggestions.dropped.why">
				You allowed Reassemble to fall off unused <Plural value={this._droppedReassembles} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
