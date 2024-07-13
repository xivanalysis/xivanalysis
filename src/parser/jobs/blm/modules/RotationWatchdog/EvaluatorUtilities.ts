import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {CycleErrorCode, CycleMetadata, DEATH_PRIORITY, HIDDEN_PRIORITY_THRESHOLD} from './WatchdogConstants'

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

export function getPreviousMetadata(window: HistoryEntry<EvaluatedAction[]>, metadataHistory: History<CycleMetadata>): CycleMetadata | undefined {
	const previousHistoryEntries = metadataHistory.entries.filter(entry => (entry.end ?? window.start) <= window.start)
	if (previousHistoryEntries.length === 0) { return }
	return previousHistoryEntries[previousHistoryEntries.length - 1].data
}
