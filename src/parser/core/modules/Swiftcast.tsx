import {MessageDescriptor} from '@lingui/core'
import {t, Trans} from '@lingui/macro'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {Action} from 'data/ACTIONS'
import STATUSES, {Status} from 'data/STATUSES'
import {BuffWindowExpectedGCDs, BuffWindowModule, BuffWindowState} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'

interface SeverityTiers {
	[key: number]: number
}

// Global default
const MISSED_SWIFTCAST_SEVERITIES: SeverityTiers = {
	1: SEVERITY.MAJOR,
}

export abstract class SwiftcastModule extends BuffWindowModule {
	static handle: string = 'swiftcast'
	static title: MessageDescriptor = t('core.swiftcast.title')`Swiftcast Actions`

	// Don't change these – it's critical for the swiftcast module
	buffAction: Action = ACTIONS.SWIFTCAST
	buffStatus: Status = STATUSES.SWIFTCAST

	/**
	 * Implementing modules MAY want to override this to change the column header, but at this point
	 * it's probably universal to call it a 'Spell'
	 */
	protected rotationTableHeader: JSX.Element = <Trans id="core.swiftcast.table.title">Spell</Trans>
	/**
	 * Implementing modules MAY want to override the suggestionContent to provide job-specific guidance.
	 */
	protected suggestionContent: JSX.Element = <Trans id="core.swiftcast.missed.suggestion.content">Use spells with <ActionLink {...ACTIONS.SWIFTCAST}/> before it expires. This allows you to use spells with cast times instantly for movement or weaving.</Trans>
	/**
	 * Implementing modules MAY want to override the severityTiers to provide job-specific severities.
	 * By default, 1 miss is a major severity
	 */
	protected severityTiers: SeverityTiers = MISSED_SWIFTCAST_SEVERITIES

	// There be dragons here; I wouldn't change these because who knows what might break
	protected expectedGCDs: BuffWindowExpectedGCDs = {
		expectedPerWindow: 1,
		suggestionContent: this.suggestionContent,
		severityTiers: this.severityTiers,
	}

	protected init() {
		super.init()
		// Inheriting the class doesn't update expectedGCDs's parameters when they
		// override, so let's (re)define it here... feels mega jank tho
		this.expectedGCDs = {
			expectedPerWindow: 1,
			suggestionContent: this.suggestionContent,
			severityTiers: this.severityTiers,
		}
	}

	// Provide our own logic for the end of the fight – even though the window is
	// ~4 GCDs 'wide', we can only use one action with it anyway; this change should
	// ding them only if they had enough time during the window to use a spell with
	// swiftcast
	protected reduceExpectedGCDsEndOfFight(buffWindow: BuffWindowState): number {
		if ( this.buffStatus.duration ) {
			// Check to see if this window is rushing due to end of fight - reduce expected GCDs accordingly
			const fightTimeRemaining = this.parser.fight.end_time - buffWindow.start
			const gcdEstimate = this.globalCooldown.getEstimate()
			return ( fightTimeRemaining > gcdEstimate ) ? 0 : 1
		}
		return 0
	}

	protected considerAction(action: Action) {
		// ignore actions that don't have a castTime
		if (!action.castTime) {
			return false
		}

		return true
	}
}
