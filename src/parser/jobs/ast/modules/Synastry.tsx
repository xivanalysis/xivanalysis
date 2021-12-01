import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	WASTED_ST_HEAL_TIERS: {
		1: SEVERITY.MINOR,
		10: SEVERITY.MEDIUM,
	},
}

const GCD_ST_HEAL: ActionKey[] = [
	'BENEFIC',
	'BENEFIC_II',
]

// Ripped off from WHM and converted to TSX
export default class Synastry extends Analyser {
	static override handle = 'synastry'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private cooldowns!: Cooldowns

	private nonSynastryHeals = 0

	private gcdStHeal: Array<Action['id']> = []

	override initialise() {
		GCD_ST_HEAL.forEach(actionKey => {
			this.gcdStHeal.push(this.data.actions[actionKey].id)
		})

		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(oneOf(this.gcdStHeal)), this.onSingleTargetHealCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onSingleTargetHealCast() {
		// Ignore if Synastry is still on CD or we already have it up
		if (this.cooldowns.remaining('SYNASTRY') > 0) {
			return
		}
		this.nonSynastryHeals++
	}

	onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SYNASTRY.icon,
			content: <Trans id="ast.synastry.suggestion.content">
				Try to use <DataLink action="SYNASTRY" /> if you need to cast a single-target GCD heal. The GCD heal itself is already an efficiency loss, so it's better to make it as strong as possible if Synastry is not needed soon.
			</Trans>,
			tiers: SEVERITIES.WASTED_ST_HEAL_TIERS,
			value: this.nonSynastryHeals,
			why: <Trans id="ast.synastry.suggestion.why">
				<Plural value={this.nonSynastryHeals} one="# single-target GCD heal was cast" other="# single-target GCD heals were cast" /> without synastry even though it was available.
			</Trans>,
		}))
	}
}
