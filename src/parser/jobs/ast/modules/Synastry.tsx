import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const WASTED_USE_TIERS = {
	3: SEVERITY.MINOR,
	10: SEVERITY.MEDIUM,
	20: SEVERITY.MAJOR, // if not used at all, it'll be set to 100 for severity checking
}

const GCD_ST_HEAL = [
	ACTIONS.BENEFIC.id,
	ACTIONS.BENEFIC_II.id,
	ACTIONS.ASPECTED_BENEFIC.id,
]

// Ripped off from WHM and converted to TSX
export default class Synastry extends Module {
	static handle = 'synastry'

	@dependency private suggestions!: Suggestions

	private lastUse = 0
	private uses = 0
	private totalHeld = 0

	protected init() {
		this.addHook('cast', {abilityId: [GCD_ST_HEAL], by: 'player'}, this.onCast)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		this.uses++
		if (this.lastUse === 0) { this.lastUse = this.parser.fight.start_time }

		const held = event.timestamp - this.lastUse - (ACTIONS.CELESTIAL_INTERSECTION.cooldown * 1000)
		if (held > 0) {
			this.totalHeld += held
		}
		// update the last use
		this.lastUse = event.timestamp
	}

	onComplete() {
		//
	}
}
