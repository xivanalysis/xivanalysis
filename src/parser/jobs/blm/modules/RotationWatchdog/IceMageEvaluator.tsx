import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ROTATION_ERRORS, DEATH_PRIORITY, DEFAULT_SEVERITY_TIERS, RotationMetadata} from '../RotationWatchdog'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'

export interface IceMageEvaluatorOpts {
	suggestionIcon: string
	metadataHistory: History<RotationMetadata>
	fireSpellIds: number[]
}

export class IceMageEvaluator extends RulePassedEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<RotationMetadata>
	private fireSpellIds: number[]

	override header = undefined

	constructor(opts: IceMageEvaluatorOpts) {
		super()

		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
		this.fireSpellIds = opts.fireSpellIds
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		if (windowMetadata.finalOrDowntime) { return } // This suggestion only applies to normal mid-fight windows

		// If they had fire spells, they weren't an ice mage, good
		if (window.data.some(event => this.fireSpellIds.includes(event.action.id))) {
			return true
		}

		// If the window had no fire spells, try to assign the error code
		assignErrorCode(windowMetadata, ROTATION_ERRORS.NO_FIRE_SPELLS)

		// If they died on this window, don't count it for the suggestion so we don't double-ding them
		if (windowMetadata.errorCode.priority !== DEATH_PRIORITY) {
			return
		}
		return false
	}

	// Suggestion not to icemage, but don't double-count it if they got cut short or we otherwise weren't showing it in the errors table
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const rotationsWithoutFire = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
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
}
