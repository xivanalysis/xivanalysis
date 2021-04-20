import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {dependency} from 'parser/core/Module'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

// Gauge numbers
const GAUGE_GAIN_AMOUNT = 5
const GAUGE_SPEND_AMOUNT = 50

export default class Gauge extends CoreGauge {
	static title = t('pld.gauge.title')`Oath Gauge Usage`

	@dependency private suggestions!: Suggestions

	private oathGauge = this.add(new CounterGauge({
		chart: {label: 'Oath Gauge', color: JOBS.PALADIN.colour},
	}))

	private oathConsumers = [
		ACTIONS.SHELTRON.id,
		ACTIONS.INTERVENTION.id,
		ACTIONS.COVER.id,
	]

	protected init() {
		super.init()

		this.addEventHook('cast', {
			by: 'player',
			abilityId: ACTIONS.ATTACK.id,
		}, this.onDamage)

		this.addEventHook('cast', {
			by: 'player',
			abilityId: this.oathConsumers,
		}, this.onConsumeOath)

		this.addEventHook('complete', this.onComplete)
	}

	// HELPERS
	private onDamage() {
		this.oathGauge.modify(GAUGE_GAIN_AMOUNT)
	}

	private onConsumeOath() {
		this.oathGauge.modify(-GAUGE_SPEND_AMOUNT)
	}

	private onComplete() {
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.SHELTRON.icon,
			content: <Trans id="pld.gauge.waste.suggestion.content">
					You should periodically use your gauge either on you with a <ActionLink {...ACTIONS.SHELTRON}/> or on your tank partner with an <ActionLink {...ACTIONS.INTERVENTION} /> in case you're off-tanking.
			</Trans>,
			why: <Trans id="pld.gauge.waste.suggestion.why">
				A total of {this.oathGauge.overCap} gauge was lost due to exceeding the cap, part of this should be used to reduce incoming damage from abilities or auto-attacks.
			</Trans>,
			severity: SEVERITY.MINOR,
			value: this.oathGauge.overCap,
		}))
	}
}
