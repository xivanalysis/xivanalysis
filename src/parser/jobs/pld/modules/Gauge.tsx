import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {CastEvent} from 'fflogs'
import {dependency} from 'parser/core/Module'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

interface GaugeModifier {
	[key: string]: number | undefined
}

const OATH_MODIFIERS = new Map<number, GaugeModifier>([
	[ACTIONS.ATTACK.id, {cast: 5}],
	[ACTIONS.SHELTRON.id, {cast: -50}],
	[ACTIONS.INTERVENTION.id, {cast: -50}],
	[ACTIONS.COVER.id, {cast: -50}],
])
export default class Gauge extends CoreGauge {
	static override title = t('pld.gauge.title')`Oath Gauge Usage`

	@dependency private suggestions!: Suggestions

	private oathGauge = this.add(new CounterGauge({
		chart: {label: 'Oath Gauge', color: JOBS.PALADIN.colour},
	}))

	protected override init() {
		super.init()

		this.addEventHook('cast', {by: 'player', abilityId: Array.from(OATH_MODIFIERS.keys())}, this.onOathModifying)
		this.addEventHook('complete', this.onComplete)
	}

	// HELPERS
	private onOathModifying(event: CastEvent) {
		const modifiers = OATH_MODIFIERS.get(event.ability.guid)

		if (modifiers) {
			const amount = modifiers[event.type] || 0
			this.oathGauge.modify(amount)
		}
	}

	private onComplete() {
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.SHELTRON.icon,
			content: <Trans id="pld.gauge.waste.suggestion.content">
					Using <ActionLink {...ACTIONS.SHELTRON}/> on yourself or <ActionLink {...ACTIONS.INTERVENTION} /> on a tank partner in case you're off tanking could reduce incoming damage from abilities or auto-attacks.
			</Trans>,
			why: <Trans id="pld.gauge.waste.suggestion.why">
				A total of {this.oathGauge.overCap} gauge was lost due to exceeding the cap.
			</Trans>,
			severity: SEVERITY.MINOR,
		}))
	}
}
