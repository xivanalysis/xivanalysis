import {Trans} from "@lingui/react"
import {EvaluatedAction} from "parser/core/modules/ActionWindow"
import {RulePassedEvaluator} from "parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator"
import {HistoryEntry} from "parser/core/modules/ActionWindow/History"
import {ReactNode} from "react"
import {ASTRAL_UMBRAL_MAX_STACKS, Gauge} from "../Gauge"

export interface InstantCastUsageEvaluatorOpts {
	blizzard3Id: number,
	gauge: Gauge
}

export class InstantCastUsageEvaluator extends RulePassedEvaluator {
	private blizzard3Id: number
	private gauge: Gauge

	override header = {
		header: <Trans id="blm.instantcast.usageevaluator.header">DPS Increase?</Trans>,
		accessor: 'dpsincrease',
	}

	constructor(opts: InstantCastUsageEvaluatorOpts) {
		super()

		this.blizzard3Id = opts.blizzard3Id
		this.gauge = opts.gauge
	}

	protected override passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		const blizzardIndex = window.data.findIndex(event => event.action.id === this.blizzard3Id)

		// If Blizzard III wasn't made instant, we can ignore this window
		if (blizzardIndex === -1) { return }

		const gaugeState = this.gauge.getGaugeState(window.data[blizzardIndex].timestamp - 1)

		// AF3 B3 will already cast faster than the GCD, so it's not a gain
		if (gaugeState.astralFire === ASTRAL_UMBRAL_MAX_STACKS) { return false }

		// It is technically a DPS increase to make B3 instant at AF1/2 since those don't have the reduced cast time, it's just not ideal
		// We'll treat it as a neutral result and give context
		if (gaugeState.astralFire > 0) { return }

		// Instant casting B3 in ice or neutral stance gets a full potency spell without the full cast time, and is an increase
		return true
	}

	protected override ruleContext(window: HistoryEntry<EvaluatedAction[]>): ReactNode {
		const blizzardIndex = window.data.findIndex(event => event.action.id === this.blizzard3Id)

		// If Blizzard III wasn't made instant, we don't need additional context
		if (blizzardIndex === -1) { return <></> }

		const gaugeState = this.gauge.getGaugeState(window.data[blizzardIndex].timestamp - 1)

		// Failure state, note that it was used at full AF
		if (gaugeState.astralFire === ASTRAL_UMBRAL_MAX_STACKS) {
			return <Trans id="blm.instantcast.usageevaluator.af3usage">Used at Astral Fire III</Trans>
		}

		// Semi-failure state, note that it was used in AF
		if (gaugeState.astralFire > 0) {
			return <Trans id="blm.instantcast.usageevaluator.afusage">Used in Astral Fire</Trans>
		}

		// We don't need additional context if it was a DPS increase
		return <></>
	}
}
