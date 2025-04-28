import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DEFAULT_SEVERITY_TIERS} from 'parser/jobs/dnc/CommonData'
import {ASTRAL_UMBRAL_MAX_STACKS, Gauge, UMBRAL_HEARTS_MAX_STACKS} from '../Gauge'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS} from './WatchdogConstants'

export interface ColdF3EvaluatorOpts {
	fire3Action: Action
	gauge: Gauge
	metadataHistory: History<CycleMetadata>
}

export class ColdF3Evaluator extends RulePassedEvaluator {
	private fire3Action: Action
	private gauge: Gauge
	private metadataHistory: History<CycleMetadata>

	override header = undefined

	constructor(opts: ColdF3EvaluatorOpts) {
		super()

		this.fire3Action = opts.fire3Action
		this.gauge = opts.gauge
		this.metadataHistory = opts.metadataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		// Fail the rule if Fire 3 was used while in Umbral Ice, and they could have gotten a Paradox by transposing
	 	const passesRule = !window.data.some((event) => event.action.id === this.fire3Action.id && this.gauge.getGaugeState(event.timestamp - 1).umbralIce === ASTRAL_UMBRAL_MAX_STACKS && this.gauge.getGaugeState(event.timestamp - 1).umbralHearts === UMBRAL_HEARTS_MAX_STACKS)

		if (!passesRule) {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
			assignErrorCode(windowMetadata, ROTATION_ERRORS.COLD_F3)
		}

		return passesRule
	}

	// Suggestion to Transpose AF1 PD F3P instead
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const rotationsWithColdF3 = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.fire3Action.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.coldf3.content">
				Casting <DataLink action="FIRE_III" /> while in Umbral Ice comes with a fairly steep damage penalty. Try to reach Astral Fire III by using <DataLink action="TRANSPOSE" /> to leave Umbral Ice, then cast <DataLink action="PARADOX" /> and use the <DataLink status="FIRESTARTER" /> proc.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: rotationsWithColdF3,
			why: <Trans id="blm.rotation-watchdog.suggestions.coldf3.why">
				<Plural value={rotationsWithColdF3} one="# Astral Fire phase" other="# Astral Fire phases"/> began with a weakened <DataLink showIcon={false} action="FIRE_III" />.
			</Trans>,
		})
	}
}
