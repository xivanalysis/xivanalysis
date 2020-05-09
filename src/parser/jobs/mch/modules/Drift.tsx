import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'

import ActionLink from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

// Escalate severity depending on how long drill/AA were drifted for
const DRIFT_SEVERITY_TIERS = {
	0.5: SEVERITY.MINOR,
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const GCDS = [
	ACTIONS.DRILL.id,
	ACTIONS.AIR_ANCHOR.id,
]

const COOLDOWN_MS = {
	[ACTIONS.DRILL.id]: ACTIONS.DRILL.cooldown * 1000,
	[ACTIONS.AIR_ANCHOR.id]: ACTIONS.AIR_ANCHOR.cooldown * 1000,
}

export default class Drift extends Module {
	static handle = 'drift'
	static title = t('mch.drift.title')`GCD Drift`

	@dependency private suggestions!: Suggestions
	@dependency private downtime!: Downtime

	private castHistory: CastEvent[] = []

	private cumDrift = {
		[ACTIONS.DRILL.id]: 0,
		[ACTIONS.AIR_ANCHOR.id]: 0,
	}

	private lastCastTimestamp = {
		[ACTIONS.DRILL.id]: this.parser.fight.start_time,
		[ACTIONS.AIR_ANCHOR.id]: this.parser.fight.start_time,
	}

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: GCDS}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		this.castHistory.push(event)
		const gcd = event.ability.guid
		if (this.lastCastTimestamp[gcd]) {  // TODO refactor?
			const lastCast = this.lastCastTimestamp[gcd]
			const downtime = this.downtime.getDowntime(lastCast, event.timestamp)
			const drift = Math.max(0, event.timestamp - lastCast - COOLDOWN_MS[gcd] - downtime)
			this.cumDrift[gcd] += drift
			this.lastCastTimestamp[gcd] = event.timestamp
		}
	}

	private onComplete() {
		const driftedDrills = this.cumDrift[ACTIONS.DRILL.id] / COOLDOWN_MS[ACTIONS.DRILL.id]
		const possibleLostDrills = Math.ceil(driftedDrills)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DRILL.icon,
			content: <Trans id="mch.drift.suggestions.drill-drift.content">
				<Plural value={possibleLostDrills} one="You may have lost a use" other="You lost multiple uses"/> of <ActionLink {...ACTIONS.DRILL} /> by letting the cooldown drift. Try to always use it as soon as it's off cooldown.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: driftedDrills,
			why: <Trans id="mch.drift.suggestions.drill-drift.why">
				<Plural value={possibleLostDrills} one="# Drill was" other="# Drills were"/> potentially lost due to drift.
			</Trans>,
		}))

		const driftedAnchors = this.cumDrift[ACTIONS.AIR_ANCHOR.id] / COOLDOWN_MS[ACTIONS.AIR_ANCHOR.id]
		const possibleLostAnchors = Math.ceil(driftedAnchors)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.AIR_ANCHOR.icon,
			content: <Trans id="mch.drift.suggestions.anchor-drift.content">
				<Plural value={possibleLostDrills} one="You may have lost a use" other="You lost multiple uses"/> of <ActionLink {...ACTIONS.AIR_ANCHOR} /> by letting the cooldown drift. Try to always use it as soon as it's off cooldown.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: driftedAnchors,
			why: <Trans id="mch.drift.suggestions.anchor-drift.why">
				<Plural value={possibleLostAnchors} one="# Air Anchor was" other="# Air Anchors were"/> potentially lost due to drift.
			</Trans>,
		}))
	}
}
