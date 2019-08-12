import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {ComboEvent} from 'parser/core/modules/Combos'
import Cooldowns from 'parser/core/modules/Cooldowns'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

interface GaugeModifier {
	[key: string]: number | undefined
}

const BEAST_MODIFIERS = new Map<number, GaugeModifier>([
	// Builders
	[ACTIONS.MAIM.id, {combo: 10}],
	[ACTIONS.STORMS_EYE.id, {combo: 10}],
	[ACTIONS.STORMS_PATH.id, {combo: 20}],
	[ACTIONS.MYTHRIL_TEMPEST.id, {combo: 20}],
	[ACTIONS.INFURIATE.id, {cast: 50}],

	// Spenders
	[ACTIONS.FELL_CLEAVE.id, {cast: -50}],
	[ACTIONS.DECIMATE.id, {cast: -50}],
	[ACTIONS.UPHEAVAL.id, {cast: -20}],
	[ACTIONS.ONSLAUGHT.id, {cast: -20}],
	[ACTIONS.CHAOTIC_CYCLONE.id, {cast: -50}],
	[ACTIONS.INNER_CHAOS.id, {cast: -50}],
])

const RAGE_USAGE_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

const INFURIATE_REDUCERS = [
	ACTIONS.FELL_CLEAVE.id,
	ACTIONS.DECIMATE.id,
	ACTIONS.CHAOTIC_CYCLONE.id,
	ACTIONS.INNER_CHAOS.id,
]
const INFURIATE_CDR = 5

export class Gauge extends CoreGauge {
	static title = t('war.gauge.title')`Gauge Usage`

	@dependency private combatants!: Combatants
	@dependency private cooldowns!: Cooldowns
	@dependency private suggestions!: Suggestions

	private beastGauge = this.add(new CounterGauge({
		chart: {label: 'Beast Gauge', color: JOBS.WARRIOR.colour},
	}))

	protected init() {
		super.init()

		this.addHook(
			['combo', 'cast'],
			{by: 'player', abilityId: Array.from(BEAST_MODIFIERS.keys())},
			this.onGaugeModifier,
		)
		this.addHook(
			'cast',
			{by: 'player', abilityId: INFURIATE_REDUCERS},
			() => this.cooldowns.reduceCooldown(ACTIONS.INFURIATE.id, INFURIATE_CDR),
		)
		this.addHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: ComboEvent | CastEvent) {
		const modifiers = BEAST_MODIFIERS.get(event.ability.guid) || {}

		// Spenders are free during IR
		let amount = modifiers[event.type] || 0
		if (this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			amount = Math.max(amount, 0)
		}

		this.beastGauge.modify(amount)
	}

	private onComplete() {
		const {overCap} = this.beastGauge
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.INFURIATE.icon,
			content: <Trans id="war.gauge.suggestions.lost-rage.content">
					Avoid letting your Beast Gauge overcap - the wasted resources may cost you uses of your spenders over the course of the fight.
			</Trans>,
			why: <Trans id="war.gauge.suggestions.lost-rage.why">
				{overCap} beast gauge lost to an overcapped gauge.
			</Trans>,
			tiers: RAGE_USAGE_SEVERITY,
			value: overCap,
		}))
	}
}
