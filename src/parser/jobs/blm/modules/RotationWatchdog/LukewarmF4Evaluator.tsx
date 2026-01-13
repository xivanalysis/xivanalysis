import {Plural, Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS} from './WatchdogConstants'

export interface LukewarmF4EvaluatorOpts {
	fire4Action: Action
	metadataHistory: History<CycleMetadata>
}

export class LukewarmF4Evaluator extends RulePassedEvaluator {
	private fire4Action: Action
	private metadataHistory: History<CycleMetadata>

	override header = undefined

	constructor(opts: LukewarmF4EvaluatorOpts) {
		super()

		this.fire4Action = opts.fire4Action
		this.metadataHistory = opts.metadataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// Fail the rule if Fire 4s were cast before reaching AF3
		const passesRule = !window.data.filter(event => event.timestamp >= windowMetadata.firePhaseMetadata.startTime && event.timestamp < windowMetadata.firePhaseMetadata.fullElementTime).some(event => event.action.id === this.fire4Action.id)

		if (!passesRule) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.LUKEWARM_F4)
		}

		return passesRule
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const rotationsWithLukewarmF4 = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.fire4Action.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.lukewarmf4.content">
				Casting <DataLink action="FIRE_IV" /> while not at full Astral Fire stacks loses the full multiplicative potency bonus of Astral Fire. Make sure to reach full Astral Fire III before starting to cast <DataLink showIcon={false} action="FIRE_IV" />.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM, // More stringent tiers since once might be a hiccup, more than that is a fundamental misunderstanding of BLM's rotation
				2: SEVERITY.MAJOR,
			},
			value: rotationsWithLukewarmF4,
			why: <Trans id="blm.rotation-watchdog.suggestions.lukewarmf4.why">
				<Plural value={rotationsWithLukewarmF4} one="# Astral Fire phase" other="# Astral Fire phases"/> contained <DataLink showIcon={false} action="FIRE_IV" /> casts below Astral Fire III.
			</Trans>,
		})
	}
}
