import {Trans} from '@lingui/macro'
import {EvaluatedAction, NotesEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'
import {getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata} from './WatchdogConstants'

export class RotationErrorNotesEvaluator extends NotesEvaluator {
	private metadataHistory: History<CycleMetadata>

	constructor (metadataHistory: History<CycleMetadata>) {
		super()
		this.metadataHistory = metadataHistory
	}

	override header = {
		header: <Trans id="blm.rotation-watchdog.rotation-table.header.reason">Why Outlier</Trans>,
		accessor: 'reason',
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>): JSX.Element {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		return <>{windowMetadata.errorCode.message}</>
	}
}
