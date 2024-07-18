import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {RaidBuffWindow, ExpectedActionGroupsEvaluator, EvaluatedAction, TrackedActionGroup} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {CREATURE_MUSES, SUBTRACTIVE_SINGLE_TARGET} from './CommonData'

export class StarryMuse extends RaidBuffWindow {
	static override handle = 'starrymuse'
	static override title = t('pct.starrymuse.title')`Starry Muse`

	override buffStatus: Status | Status[] = this.data.statuses.STARRY_MUSE

	private museActions = CREATURE_MUSES.map(key => this.data.actions[key])
	private subtractiveActions = SUBTRACTIVE_SINGLE_TARGET.map(key => this.data.actions[key])

	override prependMessages = <Message><Trans id="pct.starrymuse.table-header">
		Your <DataLink status="STARRY_MUSE" /> windows should contain your full <DataLink status="HAMMER_TIME" /> combo, <DataLink action="STAR_PRISM" />, <DataLink action="RAINBOW_DRIP" />, two <DataLink action="COMET_IN_BLACK" /> (one in the opener), and fill the remainder with your <DataLink status="SUBTRACTIVE_PALLETTE" /> spells.<br/>
		If you are doing a triple Muse burst for alignment, you will push some of your <DataLink showIcon={false} status="SUBTRACTIVE_PALLETTE" /> spells and <DataLink showIcon={false} action="RAINBOW_DRIP" /> out of the window.<br/>
		Try to make sure you use all of the expected actions in each window as seen below.
	</Trans>
	</Message>

	override initialise(): void {
		super.initialise()

		// Shouldn't also need an Expected GCD Count evaluator since the expected action groups will effectively enforce that
		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{
					actions: [this.data.actions.HAMMER_STAMP, this.data.actions.HAMMER_BRUSH, this.data.actions.POLISHING_HAMMER],
					expectedPerWindow: 3,
				},
				{
					actions: [this.data.actions.STAR_PRISM],
					expectedPerWindow: 1,
				},
				{
					actions: [this.data.actions.RAINBOW_DRIP],
					expectedPerWindow: 1,
				},
				{
					actions: [this.data.actions.COMET_IN_BLACK],
					expectedPerWindow: 2, // Default to 2, adjust to 1 for the opener
				},
				{
					actions: this.subtractiveActions,
					expectedPerWindow: 2, // Default to 2, adjust to 3 for the opener
				},
				{
					actions: this.museActions,
					expectedPerWindow: 1, // Default to 1, we'll assess the window as a triple muse if they actually got more
				},
			],
			suggestionIcon: this.data.actions.STARRY_MUSE.icon,
			suggestionWindowName: <DataLink showIcon={false} action="STARRY_MUSE" />,
			suggestionContent: <Trans id="pct.starrymuse.suggestions.expectedactions.content">Make sure your <DataLink status="STARRY_MUSE" /> windows contain all of the recommended actions in order to maximize your damage.</Trans>,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionGroupCounts.bind(this),
		}))
	}

	private adjustExpectedActionGroupCounts(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup): number {
		const attemptedTripleMuse = this.countActionsUsed(window, this.museActions) > 1
		const firstWindow = this.history.entries.length > 0 ? this.history.entries[0].start === window.start : false

		if (action.actions.includes(this.data.actions.COMET_IN_BLACK)) {
			// If they had carried-over gauge we couldn't see, let 'em
			if (this.countUsed(window, action) >= action.expectedPerWindow) { return 0 }

			// If this is the opener window, or they're doing the triple muse window, expect that they'll only fit one comet
			if (firstWindow || attemptedTripleMuse) {
				return -1
			}
		}

		if (action.actions.some(action => this.subtractiveActions.includes(action))) {
			// Only one subtractive spell can be fit into a triple muse window
			if (attemptedTripleMuse) {
				return -1
			}

			// The opener window, with no carried over gauge, should replace the second comet with a third subtractive spell
			if (firstWindow && this.countActionsUsed(window, [this.data.actions.COMET_IN_BLACK]) < 2) {
				return 1
			}
		}

		// The triple muse burst pushes Rainbow Drip out of the window
		if (action.actions.includes(this.data.actions.RAINBOW_DRIP) && attemptedTripleMuse) {
			return -1
		}

		// If they got more than one muse, assume they were trying to triple muse
		if (action.actions.some(action => this.museActions.includes(action))  && attemptedTripleMuse) {
			return 2
		}

		return 0
	}

	private countUsed(window: HistoryEntry<EvaluatedAction[]>, actionGroup: TrackedActionGroup) {
		return this.countActionsUsed(window, actionGroup.actions)
	}

	private countActionsUsed(window: HistoryEntry<EvaluatedAction[]>, actions: Action[]) {
		return window.data.filter(cast => {
			for (const action of actions) {
				if (cast.action.id === action.id) { return true }
			}
			return false
		}).length
	}

}
