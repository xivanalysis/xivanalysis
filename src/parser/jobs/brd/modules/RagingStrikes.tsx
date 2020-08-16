import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS, {Action} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import {BuffWindowModule, BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const SUPPORT_ACTIONS = [
	ACTIONS.ARMS_LENGTH,
	ACTIONS.FOOT_GRAZE,
	ACTIONS.HEAD_GRAZE,
	ACTIONS.LEG_GRAZE,
	ACTIONS.NATURES_MINNE,
	ACTIONS.PELOTON,
	ACTIONS.REPELLING_SHOT,
	ACTIONS.SECOND_WIND,
	ACTIONS.SPRINT,
	ACTIONS.THE_WARDENS_PAEAN,
	ACTIONS.TROUBADOUR,
]

export default class RagingStrikes extends BuffWindowModule {
	static handle = 'rs'
	static title = t('brd.rs.title')`Raging Strikes`

	buffAction = ACTIONS.RAGING_STRIKES
	buffStatus = STATUSES.RAGING_STRIKES

	museTimestamps: number[] = []

	expectedGCDs = {
		expectedPerWindow: 8,
		suggestionContent: <Trans id="brd.rs.suggestions.missedgcd.content">
			Try to land 8 GCDs (9 GCDs with <StatusLink {...STATUSES.ARMYS_MUSE}/>) during every <ActionLink {...ACTIONS.RAGING_STRIKES}/> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	trackedActions = {
		icon: ACTIONS.BARRAGE.icon,
		actions: [
			{
				action: ACTIONS.BARRAGE,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.IRON_JAWS,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="brd.rs.suggestions.trackedactions">
			One use of <ActionLink {...ACTIONS.BARRAGE}/> and one use of <ActionLink {...ACTIONS.IRON_JAWS}/> should occur during every <ActionLink {...ACTIONS.RAGING_STRIKES}/> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	protected init() {
		super.init()
		this.addEventHook('applybuff', {to: 'player', abilityId: [STATUSES.ARMYS_MUSE.id]}, this.onApplyMuse)
	}

	private onApplyMuse = (event: BuffEvent) => this.museTimestamps.push(event.timestamp)

	protected considerAction = (action: Action) => !SUPPORT_ACTIONS.includes(action)

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
		// If the action was Iron Jaws, the upper limit = the number of enemies we cast something on during this RS window
		if (action.action === ACTIONS.IRON_JAWS) {
			const enemyIds = new Set<string>()
			buffWindow.rotation.forEach((e: CastEvent) => {
				if (e.targetID && !e.targetIsFriendly) {
					enemyIds.add(this.getEventTargetKey(e))
				}
			})

			return enemyIds.size
		}

		return action.expectedPerWindow || 0
	}

	protected changeComparisonClassLogic(buffWindow: BuffWindowState, action: BuffWindowTrackedAction) {
		/**
		 * Positive only if we had exactly one Iron Jaws in this RS
		 * If expected > 1, we're in AoE and there is no clear rotation target, so don't highlight this cell
		 */
		if (action.action === ACTIONS.IRON_JAWS) {
			return (actual: number, expected?: number) => ({
				positive: expected === 1 && actual === 1,
				negative: expected === 1 && actual !== 1,
			})
		}
	}
}
