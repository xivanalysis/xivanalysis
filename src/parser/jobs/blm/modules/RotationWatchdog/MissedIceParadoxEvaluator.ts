import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {ASTRAL_UMBRAL_MAX_STACKS, UMBRAL_HEARTS_MAX_STACKS} from '../Gauge'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {ROTATION_ERRORS, RotationMetadata} from './RotationWatchdog'

export class MissedIceParadoxEvaluator implements WindowEvaluator {
	private metadataHistory: History<RotationMetadata>

	constructor(metadataHistory: History<RotationMetadata>) {
		this.metadataHistory = metadataHistory
	}

	// No suggestion here, just metadata assignment
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		windows.forEach(window => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
			if (windowMetadata == null) { return }

			// Check if the rotation overwrote a Paradox from the ice phase
			if (windowMetadata.firePhaseMetadata.initialGaugeState.paradox > 0 &&
				windowMetadata.firePhaseMetadata.initialGaugeState.umbralIce === ASTRAL_UMBRAL_MAX_STACKS &&
				windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts === UMBRAL_HEARTS_MAX_STACKS) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSED_ICE_PARADOX)
			}
		})
		return undefined
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
