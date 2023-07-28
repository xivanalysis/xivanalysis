import {Trans, Plural} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {TrackedActionsOptions} from 'parser/core/modules/ActionWindow/evaluators/TrackedAction'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import Parser from 'parser/core/Parser'
import React from 'react'
import {ROTATION_ERRORS, DEFAULT_SEVERITY_TIERS, RotationMetadata} from '../RotationWatchdog'
import {assignErrorCode, getMetadataForWindow, includeInSuggestions} from './EvaluatorUtilities'

export interface ExpectedFireSpellsEvaluatorOpts extends TrackedActionsOptions {
	parser: Parser
	data: Data
	invulnerability: Invulnerability
	metadataHistory: History<RotationMetadata>
}

export class ExpectedFireSpellsEvaluator extends ExpectedActionsEvaluator {
	private parser: Parser
	private data: Data
	private invulnerability: Invulnerability
	private metadataHistory: History<RotationMetadata>

	constructor(opts: ExpectedFireSpellsEvaluatorOpts) {
		super(opts)
		this.parser = opts.parser
		this.data = opts.data
		this.invulnerability = opts.invulnerability
		this.metadataHistory = opts.metadataHistory
	}

	// We only actually have a suggestion for missing Despair, but we'll assign the missing Fire 4 codes here too
	public override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const astralFiresMissingDespairs = windows.reduce((total, window) => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
			if (windowMetadata == null) { return total }

			this.expectedActions.forEach(action => {
				// If they got the expected number of actions in, no need to grump
				if (this.countUsed(window, action) >= this.determineExpected(window, action)) { return }

				// Assign error code and metadata based on which action wasn't used enough
				if (action.action.id === this.data.actions.FIRE_IV.id) {
					windowMetadata.missingFire4s = true
					assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSING_FIRE4S)
				} else if (action.action.id === this.data.actions.DESPAIR.id) {
					windowMetadata.missingDespairs = true
					assignErrorCode(windowMetadata, ROTATION_ERRORS.MISSING_DESPAIRS)
				}

				// Re-check to see if the window was actually right before a downtime but the boss became invulnerable before another Fire 4 could've been cast.
				// If so, mark it as a finalOrDowntime cycle, and clear the error code so we can check it for other errors
				if (windowMetadata.errorCode.priority === ROTATION_ERRORS.MISSING_FIRE4S.priority && this.invulnerability.isActive({
					timestamp: window.end ?? (this.parser.pull.timestamp + this.parser.pull.duration) + this.data.actions.FIRE_IV.castTime,
					types: ['invulnerable'],
				})) {
					windowMetadata.finalOrDowntime = true
					windowMetadata.errorCode = ROTATION_ERRORS.NO_ERROR
				}
			})

			return total + ((windowMetadata.missingDespairs && includeInSuggestions(windowMetadata)) ? 1 : 0)
		}, 0)

		return new TieredSuggestion({
			icon: this.data.actions.DESPAIR.icon,
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
}
