import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const CHAKRA_CAP = 5
const BH_CHAKRA_CAP = 10

const CHAKRA_OVERCAP_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	8: SEVERITY.MAJOR,
}

const ALLOWED_GCDS_WITH_CHAKRA: ActionKey[] = [
	'FORM_SHIFT',
	'SIX_SIDED_STAR', // 6SS spends chakra when used
]

/** Graph colors */
const FADE_AMOUNT = 0.25
const CHAKRA_COLOUR = Color(JOBS.MONK.colour).fade(FADE_AMOUNT)

export class Chakra extends Gauge {
	static override handle = 'chakra'
	static override title = t('mnk.gauge.chakra.title')`Chakra`

	@dependency private suggestions!: Suggestions

	private chakraGauge: CounterGauge | null = null
	private allowedGcdIds = ALLOWED_GCDS_WITH_CHAKRA.map(actionKey => this.data.actions[actionKey].id)
	private gcdsUsedAtChakraCap = 0

	override initialise() {
		super.initialise()

		const gaugeFilter = filter<Event>()
			.actor(this.parser.actor.id)
			.type('gaugeUpdate')

		this.addEventHook(gaugeFilter, this.onGaugeUpdate)
	}

	private isDamagingGcd = (id: number): id is number => {
		const action = this.data.getAction(id)
		return !!(action && action.onGcd && !this.allowedGcdIds.includes(id))
	}

	private initialiseGauge() {
		this.parser.actor.loggedGauge = true

		this.chakraGauge = this.add(new CounterGauge({
			maximum: CHAKRA_CAP,
			graph: {
				label: <Trans id="mnk.gauge.chakra.label">Chakra</Trans>,
				handle: 'chakra',
				height: 32,
				color: CHAKRA_COLOUR,
				forceCollapsed: true,
			},
		}))

		const damagingGcdFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.isDamagingGcd)

		const brotherhoodFilter = filter<Event>()
			.source(this.parser.actor.id)
			.target(this.parser.actor.id)
			.status(this.data.statuses.MEDITATIVE_BROTHERHOOD.id)

		this.addEventHook(damagingGcdFilter, this.onDamagingGcd)
		this.addEventHook(brotherhoodFilter.type('statusApply'), this.onBrotherhoodApply)
		this.addEventHook(brotherhoodFilter.type('statusRemove'), this.onBrotherhoodRemove)
		this.addEventHook('complete', this.onComplete)
	}

	private onDamagingGcd() {
		if (this.chakraGauge && this.chakraGauge.capped) {
			this.gcdsUsedAtChakraCap++
		}
	}

	private onBrotherhoodApply() {
		if (!this.chakraGauge) {
			return
		}
		this.chakraGauge.setMaximum(BH_CHAKRA_CAP)
	}

	private onBrotherhoodRemove() {
		if (!this.chakraGauge) {
			return
		}
		this.chakraGauge.setMaximum(CHAKRA_CAP)
	}

	private onGaugeUpdate(event: Events['gaugeUpdate']) {
		if (!this.parser.actor.loggedGauge) {
			this.initialiseGauge()
		}

		if (this.chakraGauge && 'chakra' in event && event.chakra !== this.chakraGauge.value) {
			this.chakraGauge.set(event.chakra)
		}
	}

	private onComplete() {
		if (!this.chakraGauge) {
			return
		}

		const chakraOvercap = this.chakraGauge.overCap
		const potencyLost = chakraOvercap * (this.data.actions.THE_FORBIDDEN_CHAKRA.potency / CHAKRA_CAP)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.THE_FORBIDDEN_CHAKRA.icon,
			content: <Trans id="mnk.gauge.chakra.suggestions.overcap.content">
				Avoid overcapping chakra by weaving <DataLink action="THE_FORBIDDEN_CHAKRA" /> or <DataLink action="ENLIGHTENMENT" /> whenever possible. You used <Plural value={this.gcdsUsedAtChakraCap} one="# GCD" other="# GCDs" /> while your chakra gauge was already capped.
			</Trans>,
			tiers: CHAKRA_OVERCAP_SEVERITY,
			value: chakraOvercap,
			why: <Trans id="mnk.gauge.chakra.suggestions.overcap.why">
				<Plural value={chakraOvercap} one="# chakra was" other="# chakras were" /> lost due to overcapping. This equates to {potencyLost} potency lost.
			</Trans>,
		}))
	}
}
