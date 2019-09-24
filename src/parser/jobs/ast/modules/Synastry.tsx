import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	WASTED_ST_HEAL_TIERS: {
		1: SEVERITY.MINOR,
		10: SEVERITY.MEDIUM,
	},
}

const GCD_ST_HEAL = [
	ACTIONS.BENEFIC.id,
	ACTIONS.BENEFIC_II.id,
]

// Ripped off from WHM and converted to TSX
export default class Synastry extends Module {
	static handle = 'synastry'

	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions

	private lastUse = 0
	private uses = 0
	private totalHeld = 0
	private nonSynastryHeals = 0

	protected init() {
		this.addHook('cast', {abilityId: ACTIONS.SYNASTRY.id, by: 'player'}, this.onCast)
		this.addHook('cast', {abilityId: GCD_ST_HEAL, by: 'player'}, this.onSingleTargetHealCast)
		this.addHook('complete', this.onComplete)
	}

	private onSingleTargetHealCast(event: CastEvent) {
		// Ignore if Synastry is still on CD or we already have it up
		if (this.combatants.selected.hasStatus(STATUSES.SYNASTRY_SELF.id)
		|| this.lastUse + (ACTIONS.SYNASTRY.cooldown * 1000) > event.timestamp) {
			return
		}
		this.nonSynastryHeals++
	}

	private onCast(event: CastEvent) {
		this.uses++
		if (this.lastUse === 0) { this.lastUse = this.parser.fight.start_time }

		const held = event.timestamp - this.lastUse - (ACTIONS.SYNASTRY.cooldown * 1000)
		if (held > 0) {
			this.totalHeld += held
		}
		// update the last use
		this.lastUse = event.timestamp
	}

	onComplete() {
		if (this.nonSynastryHeals) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SYNASTRY.icon,
				content: <Trans id="ast.synastry.suggestion.content">
					Try to use <ActionLink {...ACTIONS.SYNASTRY} /> if you need to cast a single-target GCD heal. The GCD heal itself is already an efficiency loss, so it's better to make it as strong as possible if Synastry is not needed soon.
				</Trans>,
				tiers: SEVERITIES.WASTED_ST_HEAL_TIERS,
				value: this.nonSynastryHeals,
				why: <Trans id="ast.synastry.suggestion.why">
					<Plural value={this.nonSynastryHeals} one="# single-target GCD heal was cast" other="# single-target GCD heals were cast" /> without synastry even though it was available.
				</Trans>,
			}))
		}
	}
}
