import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {Action} from 'data/ACTIONS'
import {ActionRoot} from 'data/ACTIONS/root'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import {BuffWindowModule, BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isDefined} from 'utilities'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const SUPPORT_ACTIONS: Array<keyof ActionRoot> = [
	'ARMS_LENGTH',
	'FOOT_GRAZE',
	'HEAD_GRAZE',
	'LEG_GRAZE',
	'NATURES_MINNE',
	'PELOTON',
	'REPELLING_SHOT',
	'SECOND_WIND',
	'SPRINT',
	'THE_WARDENS_PAEAN',
	'TROUBADOUR',
]

export default class RagingStrikes extends BuffWindowModule {
	static handle = 'rs'
	static title = t('brd.rs.title')`Raging Strikes`
	static displayOrder = DISPLAY_ORDER.RAGING_STRIKES

	buffAction = this.data.actions.RAGING_STRIKES
	buffStatus = this.data.statuses.RAGING_STRIKES

	private museTimestamps: number[] = []
	private SUPPORT_ACTIONS: number[] = []

	expectedGCDs = {
		expectedPerWindow: 8,
		suggestionContent: <Trans id="brd.rs.suggestions.missedgcd.content">
			Try to land 8 GCDs (9 GCDs with <StatusLink {...STATUSES.ARMYS_MUSE}/>) during every <ActionLink {...this.data.actions.RAGING_STRIKES}/> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	trackedActions = {
		icon: this.data.actions.BARRAGE.icon,
		actions: [
			{
				action: this.data.actions.BARRAGE,
				expectedPerWindow: 1,
			},
			{
				action: this.data.actions.IRON_JAWS,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="brd.rs.suggestions.trackedactions.content">
			One use of <ActionLink {...this.data.actions.BARRAGE}/> and one use of <ActionLink {...this.data.actions.IRON_JAWS}/> should occur during every <ActionLink {...this.data.actions.RAGING_STRIKES}/> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	protected init() {
		super.init()

		this.SUPPORT_ACTIONS = SUPPORT_ACTIONS.map(actionKey => this.data.actions[actionKey].id)
		this.addEventHook('applybuff', {to: 'player', abilityId: [STATUSES.ARMYS_MUSE.id]}, this.onApplyMuse)
	}

	private onApplyMuse = (event: BuffEvent) => this.museTimestamps.push(event.timestamp)

	protected considerAction = (action: Action) => !this.SUPPORT_ACTIONS.includes(action.id)

	protected changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
		// Expect one extra GCD if we had muse up for this RS
		const museDuration = STATUSES.ARMYS_MUSE.duration * 1000
		const isMuseUp = this.museTimestamps
			.filter(ts => ts < buffWindow.start && ts > buffWindow.start - museDuration)
			.length === 1

		return isMuseUp ? 1 : 0
	}

	private getEventTargetKey = (event: CastEvent): string => `${event.targetID}-${event.targetInstance}`

	protected getBaselineExpectedTrackedAction(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		if (action.action !== this.data.actions.IRON_JAWS) {
			return action.expectedPerWindow || 0
		}

		// If the action was Iron Jaws, the upper limit = the number of enemies we cast something on during this RS window
		const enemyIDs = new Set<string>()
		buffWindow.rotation.forEach((e: CastEvent) => {
			if (e.targetID && !e.targetIsFriendly) {
				enemyIDs.add(this.getEventTargetKey(e))
			}
		})

		return enemyIDs.size
	}

	protected reduceTrackedActionsEndOfFight(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		const windowDurationMillis = this.buffStatus.duration * 1000
		const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)

		/**
		 * IJ definitely shouldn't be used at the end of the fight, so reduce by 1
		 * Barrage might have floated to the end of the RS window, so reduce by 1
		 */
		if (windowDurationMillis >= fightTimeRemaining) {
			return 1
		}

		return 0
	}

	protected changeComparisonClassLogic(buffWindow: BuffWindowState, action: BuffWindowTrackedAction) {
		/**
		 * Positive only if we had exactly one Iron Jaws in this RS
		 * If expected > 1, we're in AoE and there is no clear rotation target, so don't highlight this cell
		 */
		if (action.action === this.data.actions.IRON_JAWS) {
			return (actual: number, expected?: number) => {
				if (!isDefined(expected) || expected > 1) {
					return RotationTargetOutcome.NEUTRAL
				} else if (actual === 1) {
					return RotationTargetOutcome.POSITIVE
				} else {
					return RotationTargetOutcome.NEGATIVE
				}
			}
		}
	}
}
