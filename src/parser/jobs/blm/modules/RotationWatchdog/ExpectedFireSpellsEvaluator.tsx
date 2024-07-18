import {Trans, Plural} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {TrackedAction, TrackedActionsOptions} from 'parser/core/modules/ActionWindow/evaluators/TrackedAction'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {assignErrorCode, getMetadataForWindow, includeInSuggestions} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS, DEFAULT_SEVERITY_TIERS} from './WatchdogConstants'

export type ExpectedFireSpellsEvaluatorOpts =
	& Omit<TrackedActionsOptions, 'suggestionIcon' | 'suggestionContent' | 'suggestionWindowName' | 'severityTiers'>
	& {
	pullEnd: number
	despairAction: Action
	fire4Action: Action
	flareStarAction: Action
	invulnerability: Invulnerability
	metadataHistory: History<CycleMetadata>
}

export class ExpectedFireSpellsEvaluator extends ExpectedActionsEvaluator {
	private pullEnd: number
	private despairAction: Action
	private fire4Action: Action
	private flareStarAction: Action
	private invulnerability: Invulnerability
	private metadataHistory: History<CycleMetadata>

	constructor(opts: ExpectedFireSpellsEvaluatorOpts) {
		super({...opts,
			suggestionIcon: '',
			suggestionContent: <></>,
			suggestionWindowName: <></>,
			severityTiers: {},
		})
		this.pullEnd = opts.pullEnd
		this.despairAction = opts.despairAction
		this.fire4Action = opts.fire4Action
		this.flareStarAction = opts.flareStarAction
		this.invulnerability = opts.invulnerability
		this.metadataHistory = opts.metadataHistory
	}

	// We only actually have a suggestion for missing Despair, but we'll assign the missing Fire 4 codes here too
	public override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const astralFiresMissingDespairs = windows.reduce((total, window) => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

			this.expectedActions.forEach(action => this.assessWindowAction(window, windowMetadata, action))

			return total + ((windowMetadata.missingDespairs && includeInSuggestions(windowMetadata)) ? 1 : 0)
		}, 0)

		return new TieredSuggestion({
			icon: this.despairAction.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.content">
				Once you can no longer cast another spell in Astral Fire and remain above 800 MP, you should use your remaining MP by casting <DataLink action="DESPAIR"/>.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: astralFiresMissingDespairs,
			why: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.why">
				<Plural value={astralFiresMissingDespairs} one="# Astral Fire phase was" other="# Astral Fire phases were"/> missing at least one <DataLink showIcon={false} action="DESPAIR"/>.
			</Trans>,
		})
	}

	override determineExpected(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// Fire 4 has some special handling for showing the undefined denominator for rushed windows
		// Also we need to make sure we don't re-run the count evaluation for the action if we already did
		// If we do, it can screw up other evaluators
		if (action.action.id === this.fire4Action.id) {
			if (windowMetadata.finalOrDowntime) { return undefined }
			if (windowMetadata.expectedFire4s >= 0) { return windowMetadata.expectedFire4s }
		}
		if (action.action.id === this.despairAction.id && windowMetadata.expectedDespairs >= 0) {
			return windowMetadata.expectedDespairs
		}
		if (action.action.id === this.flareStarAction.id && windowMetadata.expectedFlareStars >= 0) {
			return windowMetadata.expectedFlareStars
		}

		return super.determineExpected(window, action)
	}

	private assessWindowAction(window: HistoryEntry<EvaluatedAction[]>, windowMetadata: CycleMetadata, action: TrackedAction) {
		// If they got the expected number of actions in, no need to grump
		if (this.countUsed(window, action) >= (this.determineExpected(window, action) ?? 0)) { return }

		// Assign error code and metadata based on which action wasn't used enough
		switch (action.action.id) {
		case this.fire4Action.id:
			windowMetadata.missingFire4s = true
			assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSING_FIRE4S)
			break
		case this.despairAction.id:
			windowMetadata.missingDespairs = true
			assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSING_DESPAIRS)
			break
		case this.flareStarAction.id:
			windowMetadata.missingFlareStars = true
			assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSING_FLARE_STARS)
		}

		// Re-check to see if the window was actually right before a downtime but the boss became invulnerable before another Fire 4 could've been cast.
		// If so, mark it as a finalOrDowntime cycle, and clear the error code so we can check it for other errors
		if (windowMetadata.errorCode.priority === ROTATION_ERRORS.MISSING_FIRE4S.priority && this.invulnerability.isActive({
			timestamp: (window.end ?? this.pullEnd) + (this.fire4Action.castTime ?? 0),
			types: ['invulnerable'],
		})) {
			windowMetadata.finalOrDowntime = true
			windowMetadata.errorCode = ROTATION_ERRORS.NO_ERROR
		}
	}
}
