import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_MOD = {
	MINOR: 0.15,
	MEDIUM: 0.5,
	MAJOR: 0.8,
}

// Lifted from WHM benison and adapted to AST and TSX
export default class CelestialIntersection extends Module {
	static handle = 'celestialintersection'

	@dependency private suggestions!: Suggestions

	private lastUse = 0
	private uses = 0
	private totalHeld = 0

	protected init() {
		this.addEventHook('cast', {abilityId: ACTIONS.CELESTIAL_INTERSECTION.id, by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
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
		const holdDuration = this.uses === 0 ? this.parser.currentDuration : this.totalHeld
		const usesMissed = Math.floor(holdDuration / (ACTIONS.CELESTIAL_INTERSECTION.cooldown * 1000))
		const fightDuration = this.parser.fight.end_time - this.parser.fight.start_time
		const maxUses = (fightDuration / (ACTIONS.CELESTIAL_INTERSECTION.cooldown * 1000) ) - 1

		const WASTED_USE_TIERS = {
			[maxUses * SEVERITY_MOD.MINOR]: SEVERITY.MINOR,
			[maxUses * SEVERITY_MOD.MEDIUM]: SEVERITY.MEDIUM,
			[maxUses * SEVERITY_MOD.MAJOR]: SEVERITY.MAJOR, // if not used at all, it'll be set to 100 for severity checking
		}

		if (usesMissed > 1 || this.uses === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.CELESTIAL_INTERSECTION.icon,
				content: <Trans id="ast.celestial-intersection.suggestion.content">
					Use <ActionLink {...ACTIONS.CELESTIAL_INTERSECTION} /> more frequently. Frequent uses can heal or mitigate a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs.
				</Trans>,
				tiers: WASTED_USE_TIERS,
				value: this.uses === 0 ? 100 : usesMissed,
				why: <Trans id="ast.celestial-intersection.suggestion.why">
					About {usesMissed} uses of <ActionLink {...ACTIONS.CELESTIAL_INTERSECTION} /> were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Trans>,
			}))
		}
	}
}
