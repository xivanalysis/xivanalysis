import {Trans} from '@lingui/macro'
import {EvaluatedAction, NotesEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'
import {getMetadataForWindow} from './EvaluatorUtilities'
import {RotationMetadata} from './RotationWatchdog'

export class RotationErrorNotesEvaluator extends NotesEvaluator {
	private metadataHistory: History<RotationMetadata>

	constructor (metadataHistory: History<RotationMetadata>) {
		super()
		this.metadataHistory = metadataHistory
	}

	override header = {
		header: <Trans id="blm.rotation-watchdog.rotation-table.header.reason">Why Outlier</Trans>,
		accessor: 'reason',
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>): JSX.Element {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
		if (windowMetadata == null) {
			return <></>
		}

		return <>{windowMetadata.errorCode.message}</>
	}
}
