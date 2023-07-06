import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {assignErrorCode} from './EvaluatorUtilities'
import {ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS, RotationMetadata} from './RotationWatchdog'

export interface ManafontTimingEvaluatorOpts {
	data: Data,
	metadataHistory: History<RotationMetadata>
}

export class ManafontTimingEvaluator implements WindowEvaluator {
	private data: Data
	private metadataHistory: History<RotationMetadata>

	constructor(opts: ManafontTimingEvaluatorOpts) {
		this.data = opts.data
		this.metadataHistory = opts.metadataHistory
	}

	// Suggestion to not use Manafont before Despair
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const manafontsBeforeDespair = windows.reduce((total, window) => {
			const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)?.data
			if (windowMetadata == null) { return total }

			const currentRotation = window.data
			const manafontIndex = currentRotation.findIndex(event => event.action.id === this.data.actions.MANAFONT.id)
			if (manafontIndex === -1) { return total }

			const despairIndex = currentRotation.findIndex(event => event.action.id === this.data.actions.DESPAIR.id)
			if (manafontIndex < despairIndex || despairIndex === -1) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.MANAFONT_BEFORE_DESPAIR)
				return total + 1
			}

			return total
		}, 0)

		return new TieredSuggestion({
			icon: this.data.actions.MANAFONT.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
				Using <DataLink action="MANAFONT"/> before <DataLink action="DESPAIR"/> leads to fewer <DataLink showIcon={false} action="DESPAIR"/>s than possible being cast. Try to avoid that since <DataLink showIcon={false} action="DESPAIR"/> is stronger than <DataLink action="FIRE_IV"/>.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: manafontsBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<DataLink showIcon={false} action="MANAFONT"/> was used before <DataLink action="DESPAIR"/> <Plural value={manafontsBeforeDespair} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
