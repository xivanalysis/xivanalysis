import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_MOD = {
	MINOR: 0.15,
	MEDIUM: 0.5,
	MAJOR: 0.8,
}

// Lifted from WHM benison and adapted to AST and TSX
export default class CelestialIntersection extends Analyser {
	static override handle = 'celestialintersection'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private lastUse = 0
	private uses = 0
	private totalHeld = 0

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.CELESTIAL_INTERSECTION.id), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']) {
		this.uses++
		if (this.lastUse === 0) { this.lastUse = this.parser.pull.timestamp }

		const held = event.timestamp - this.lastUse - this.data.actions.CELESTIAL_INTERSECTION.cooldown
		if (held > 0) {
			this.totalHeld += held
		}
		// update the last use
		this.lastUse = event.timestamp
	}

	onComplete() {
		const holdDuration = this.uses === 0 ? this.parser.currentDuration : this.totalHeld
		const usesMissed = Math.floor(holdDuration / (this.data.actions.CELESTIAL_INTERSECTION.cooldown))
		//TODO update max uses to not use the whole duration such as when there are no available targets
		const maxUses = (this.parser.pull.duration / this.data.actions.CELESTIAL_INTERSECTION.cooldown) - 1

		const WASTED_USE_TIERS = {
			[maxUses * SEVERITY_MOD.MINOR]: SEVERITY.MINOR,
			[maxUses * SEVERITY_MOD.MEDIUM]: SEVERITY.MEDIUM,
			[maxUses * SEVERITY_MOD.MAJOR]: SEVERITY.MAJOR, // if not used at all, it'll be set to 100 for severity checking
		}

		if (usesMissed > 1 || this.uses === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.CELESTIAL_INTERSECTION.icon,
				content: <Trans id="ast.celestial-intersection.suggestion.content">
					Use <DataLink action="CELESTIAL_INTERSECTION" /> more frequently. Frequent uses can heal or mitigate a large amount of damage over the course of a fight, potentially resulting in fewer required healing GCDs.
				</Trans>,
				tiers: WASTED_USE_TIERS,
				value: this.uses === 0 ? 100 : usesMissed,
				why: <Trans id="ast.celestial-intersection.suggestion.why">
					About {usesMissed} uses of <DataLink action="CELESTIAL_INTERSECTION" /> were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Trans>,
			}))
		}
	}
}
