import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {CycleErrorCode, DEATH_PRIORITY, HIDDEN_PRIORITY_THRESHOLD, CycleMetadata} from '../RotationWatchdog'

export function assignErrorCode(metadata: CycleMetadata, errorCode: CycleErrorCode) {
	if (metadata.errorCode.priority < errorCode.priority) {
		metadata.errorCode = errorCode
	}
}

export function includeInSuggestions(metadata: CycleMetadata): boolean {
	return metadata.errorCode.priority < DEATH_PRIORITY && metadata.errorCode.priority > HIDDEN_PRIORITY_THRESHOLD
}

export function getMetadataForWindow(window: HistoryEntry<EvaluatedAction[]>, metadataHistory: History<CycleMetadata>): CycleMetadata {
	let windowMetadataEntry = metadataHistory.entries.find(entry => entry.start === window.start)
	if (windowMetadataEntry == null) {
		windowMetadataEntry = metadataHistory.openNew(window.start)
	}
	return windowMetadataEntry.data
}
