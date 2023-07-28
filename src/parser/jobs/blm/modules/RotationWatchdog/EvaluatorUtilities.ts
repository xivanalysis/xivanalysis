import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {RotationErrorCode, DEATH_PRIORITY, HIDDEN_PRIORITY_THRESHOLD, RotationMetadata} from '../RotationWatchdog'

export function assignErrorCode(metadata: RotationMetadata, errorCode: RotationErrorCode) {
	if (metadata.errorCode.priority < errorCode.priority) {
		metadata.errorCode = errorCode
	}
}

export function includeInSuggestions(metadata: RotationMetadata): boolean {
	return metadata.errorCode.priority < DEATH_PRIORITY && metadata.errorCode.priority > HIDDEN_PRIORITY_THRESHOLD
}

export function getMetadataForWindow(window: HistoryEntry<EvaluatedAction[]>, metadataHistory: History<RotationMetadata>): RotationMetadata | undefined {
	return metadataHistory.entries.find(entry => entry.start === window.start)?.data
}
