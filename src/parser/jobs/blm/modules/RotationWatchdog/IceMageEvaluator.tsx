import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {assignErrorCode} from './EvaluatorUtilities'
import {ROTATION_ERRORS, DEATH_PRIORITY, DEFAULT_SEVERITY_TIERS, RotationMetadata} from './RotationWatchdog'

export interface IceMageEvaluatorOpts {
	data: Data,
	metadataHistory: History<RotationMetadata>
	fireSpellIds: number[]
}

export class IceMageEvaluator implements WindowEvaluator {
	private data: Data
	private metadataHistory: History<RotationMetadata>
	private fireSpellIds: number[]

	constructor(opts: IceMageEvaluatorOpts) {
		this.data = opts.data
		this.metadataHistory = opts.metadataHistory
		this.fireSpellIds = opts.fireSpellIds
	}

	// Suggestion not to icemage, but don't double-count it if they got cut short or we otherwise weren't showing it in the errors table
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const rotationsWithoutFire = windows.reduce((total, window) => {
			const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)?.data
			if (windowMetadata == null) { return total }
			if (windowMetadata.finalOrDowntime) { return total } // This suggestion only applies to normal mid-fight windows

			// If the window had no fire spells, try to assign the error code
			if (!window.data.some(event => this.fireSpellIds.includes(event.action.id))) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.NO_FIRE_SPELLS)

				// If they died on this window, don't count it for the suggestion so we don't double-ding them
				if (windowMetadata.errorCode.priority !== DEATH_PRIORITY) {
					return total + 1
				}
			}

			return total
		}, 0)

		return new TieredSuggestion({
			icon: this.data.actions.BLIZZARD_II.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.icemage.content">
				Avoid spending significant amounts of time in Umbral Ice. The majority of your damage comes from your Astral Fire phase, so you should maximize the number of <DataLink action="FIRE_IV"/>s cast during the fight.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: rotationsWithoutFire,
			why: <Trans id="blm.rotation-watchdog.suggestions.icemage.why">
				<Plural value={rotationsWithoutFire} one="# rotation was" other="# rotations were"/> performed with no fire spells.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
