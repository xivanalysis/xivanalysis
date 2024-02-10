import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {ASTRAL_UMBRAL_MAX_STACKS, UMBRAL_HEARTS_MAX_STACKS} from '../Gauge'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS} from './WatchdogConstants'

export class MissedIceParadoxEvaluator extends RulePassedEvaluator {
	private metadataHistory: History<CycleMetadata>

	override header = undefined

	constructor(metadataHistory: History<CycleMetadata>) {
		super()

		this.metadataHistory = metadataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>): undefined {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// Check if the rotation overwrote a Paradox from the ice phase
		if (windowMetadata.firePhaseMetadata.initialGaugeState.paradox > 0 &&
			windowMetadata.firePhaseMetadata.initialGaugeState.umbralIce === ASTRAL_UMBRAL_MAX_STACKS &&
			windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts === UMBRAL_HEARTS_MAX_STACKS) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSED_ICE_PARADOX)
		}
		return
	}

	// No suggestion here, just metadata assignment
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		windows.forEach(window => this.passesRule(window))
		return undefined
	}
}
