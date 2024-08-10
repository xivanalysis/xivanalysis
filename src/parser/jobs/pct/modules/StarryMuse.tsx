import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {RaidBuffWindow, ExpectedActionGroupsEvaluator, EvaluatedAction, TrackedActionGroup, LimitedActionsEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {ADDITIVE_SPELLS, CREATURE_MOTIFS, CREATURE_MUSES, SUBTRACTIVE_SINGLE_TARGET} from './CommonData'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class StarryMuse extends RaidBuffWindow {
	static override handle = 'starrymuse'
	static override title = t('pct.starrymuse.title')`Starry Muse`
	static override displayOrder = DISPLAY_ORDER.STARRY_MUSE

	override buffStatus: Status | Status[] = this.data.statuses.STARRY_MUSE

	private museActions = CREATURE_MUSES.map(key => this.data.actions[key])
	private creatureMotifs = CREATURE_MOTIFS.map(key => this.data.actions[key])
	private subtractiveActions = SUBTRACTIVE_SINGLE_TARGET.map(key => this.data.actions[key])

	override prependMessages = <Message>
		<Trans id="pct.starrymuse.table-header">
			Your <DataLink status="STARRY_MUSE" /> windows should contain your full <DataLink status="HAMMER_TIME" /> combo, <DataLink action="STAR_PRISM" />, <DataLink action="RAINBOW_DRIP" />, two <DataLink action="COMET_IN_BLACK" /> (one in the opener), and fill the remainder with your <DataLink status="SUBTRACTIVE_PALETTE" /> spells.<br/>
			If you are using more muses for buff alignment reasons, you will push some of your <DataLink showIcon={false} status="SUBTRACTIVE_PALETTE" /> spells and <DataLink showIcon={false} action="RAINBOW_DRIP" /> out of the window.<br/>
			Try to make sure you use all of the expected actions in each window as seen below.
		</Trans>
	</Message>

	override initialise(): void {
		super.initialise()

		this.ignoreActions([this.data.actions.STAR_PRISM_CURE.id])

		// Shouldn't also need an Expected GCD Count evaluator since the expected action groups will effectively enforce that
		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{
					actions: [this.data.actions.HAMMER_STAMP, this.data.actions.HAMMER_BRUSH, this.data.actions.POLISHING_HAMMER],
					expectedPerWindow: 3,
					overrideHeader: <DataLink showName={false} status="HAMMER_TIME" />,
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
					expectedPerWindow: 1,
				},
				{
					actions: this.subtractiveActions,
					expectedPerWindow: 3,
					overrideHeader: <DataLink showName={false} status="SUBTRACTIVE_PALETTE" />,
				},
				{
					actions: this.museActions,
					expectedPerWindow: 1, // Assume they'll have one prepped, if they cast a motif, we'll expect that to get used as well
					overrideHeader: <DataLink showName={false} action="LIVING_MUSE" />,
				},
				{
					actions: [
						this.data.actions.MOG_OF_THE_AGES,
						this.data.actions.RETRIBUTION_OF_THE_MADEEN,
					],
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.STARRY_MUSE.icon,
			suggestionWindowName: <DataLink showIcon={false} action="STARRY_MUSE" />,
			suggestionContent: <Trans id="pct.starrymuse.suggestions.expected-actions.content">To maximize your damage, you should make sure your <DataLink status="STARRY_MUSE" /> windows contain all of the recommended actions.</Trans>,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionGroupCounts.bind(this),
		}))

		this.addEvaluator(new LimitedActionsEvaluator({
			expectedActions: ADDITIVE_SPELLS.map<TrackedAction>(key => {
				return {
					action: this.data.actions[key],
					expectedPerWindow: 0,
				}
			}),
			suggestionIcon: this.data.actions.FIRE_IN_RED.icon,
			suggestionWindowName: <DataLink showIcon={false} action="STARRY_MUSE" />,
			suggestionContent: <Trans id="pct.starrymuse.suggestions.limited-actions.content">Avoid using the additive paint spells during your <DataLink status="STARRY_MUSE" /> windows. The <DataLink status="SUBTRACTIVE_PALETTE" /> spells have higher potency, allowing you to do more damage during your burst.</Trans>,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
		}))
	}

	private adjustExpectedActionGroupCounts(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup): number {
		const motifsPainted = this.countActionsUsed(window, this.creatureMotifs)

		if (action.actions.some(action => this.subtractiveActions.includes(action))) {
			let adjustment = 0
			// Only one subtractive spell can normally be fit into a multi-muse window
			if (motifsPainted > 0) {
				adjustment -= 2
			}

			// Carrying a comet into the window (commonly referred to as KMYK) means pushing the third Subtractive spell out of the window
			if (this.countActionsUsed(window, [this.data.actions.COMET_IN_BLACK]) > 1) {
				adjustment--
			}

			return adjustment
		}

		// A multi-muse burst pushes Rainbow Drip out of the window
		if (action.actions.includes(this.data.actions.RAINBOW_DRIP) && motifsPainted > 0) {
			return -1
		}

		// If they painted a motif during the burst window, they should make sure to use the muse in the window too
		if (action.actions.some(action => this.museActions.includes(action))) {
			return motifsPainted
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
