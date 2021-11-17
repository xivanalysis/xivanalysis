import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_MOD = {
	MINOR: 0.1,
	MEDIUM: 0.3,
	MAJOR: 0.5,
}

interface Status {
	id: number
	name: string
	icon: string
	duration?: number
	stacksApplied?: number
	speedModifier?: number
}

// Lifted from WHM benison and adapted to AST and TSX
export default class CelestialOpposition extends Analyser {
	static override handle = 'celestialopposition'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private lastUse: number = 0
	private uses: number = 0
	private totalHeld: number = 0

	private activeSect: Status | undefined

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.CELESTIAL_OPPOSITION.id)
		, this.onCast)

		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('statusApply')
			.status(this.data.statuses.NOCTURNAL_SECT.id)
		, this.onSect)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']) {
		this.uses++
		if (this.lastUse === 0) { this.lastUse = this.parser.pull.timestamp  }

		const held = event.timestamp - this.lastUse - this.data.actions.CELESTIAL_OPPOSITION.cooldown
		if (held > 0) {
			this.totalHeld += held
		}
		// update the last use
		this.lastUse = event.timestamp
	}

	private onSect(event: Events['statusApply']) {
		this.activeSect = getDataBy(this.data.statuses, 'id', event.status)
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
		const suggestContentDiurnal = <Trans id="ast.celestial-opposition.suggestion.content.diurnal">
				Use <DataLink action="CELESTIAL_OPPOSITION" /> more frequently. In <DataLink status="DIURNAL_SECT" />, the heal and regen combined add up to the same potency of a <DataLink action="BENEFIC_II" /> on each player it reaches.
				Trusting the regens to top off the party HP will save MP and GCDs on healing.
		</Trans>
		const suggestContentNoct = <Trans id="ast.celestial-opposition.suggestion.content.noct">
				Use <DataLink action="CELESTIAL_OPPOSITION" /> more frequently. In <DataLink status="NOCTURNAL_SECT" />, the shield is the same potency as from <DataLink action="ASPECTED_HELIOS" />,
				so it can save MP and GCDs casting it. Since shields last 30 seconds it can be cast much earlier than incoming damage and allow the cooldown to refresh sooner.
		</Trans>

		const content = this.activeSect && this.activeSect.id === this.data.statuses.NOCTURNAL_SECT.id ? suggestContentNoct : suggestContentDiurnal

		if (usesMissed > 1 || this.uses === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.CELESTIAL_OPPOSITION.icon,
				content,
				tiers: WASTED_USE_TIERS,
				value: this.uses === 0 ? 100 : usesMissed,
				why: <Trans id="ast.celestial-opposition.suggestion.why">
					About {usesMissed} uses of <DataLink action="CELESTIAL_OPPOSITION" /> were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Trans>,
			}))
		}
	}
}
