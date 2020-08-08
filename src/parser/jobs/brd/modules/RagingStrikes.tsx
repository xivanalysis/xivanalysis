import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
<<<<<<< HEAD
import ACTIONS, {Action} from 'data/ACTIONS'
import STATUSES, {Status} from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {BuffWindowModule, BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'
import Enemies from 'parser/core/modules/Enemies'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {any} from 'prop-types'

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
=======
import ACTIONS from 'data/ACTIONS'
import STATUSES, {Status} from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import {BuffWindowModule, BuffWindowState} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
>>>>>>> initial RS buffwindow

export default class RagingStrikes extends BuffWindowModule {
	static handle = 'rs'
	static title = t('brd.rs.title')`Raging Strikes`
<<<<<<< HEAD
	static debug = true

	@dependency private enemies!: Enemies
	@dependency private invuln!: Invulnerability
=======
>>>>>>> initial RS buffwindow

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
			2: SEVERITY.MEDIUM,
			4: SEVERITY.MAJOR,
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
			2: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}

	protected init() {
		super.init()
		this.addEventHook('applybuff', {to: 'player', abilityId: [STATUSES.ARMYS_MUSE.id]}, this.onApplyMuse)
	}

	private onApplyMuse(event: BuffEvent) {
		this.museTimestamps.push(event.timestamp)
	}

<<<<<<< HEAD
	protected considerAction(action: Action) {
		return !SUPPORT_ACTIONS.includes(action)
	}

	protected changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
		// Expect one extra GCD if we had muse up for this RS
=======
	protected changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
>>>>>>> initial RS buffwindow
		const museDuration = STATUSES.ARMYS_MUSE.duration * 1000
		const isMuseUp = this.museTimestamps
			.filter(ts => ts < buffWindow.start && ts > buffWindow.start - museDuration)
			.length === 1

<<<<<<< HEAD
		return isMuseUp ? 1 : 0
	}

	protected getBaselineExpectedTrackedAction(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		if (action.action === ACTIONS.IRON_JAWS) {
			const enemyIds = Object.keys(this.enemies.getEntities())
			const buffStart = buffWindow.rotation[0].timestamp
			const buffEnd = buffWindow.rotation.slice(-1)[0].timestamp
			const targetableEnemies = enemyIds.filter(id => !this.invuln.isUntargetable(Number(id), buffStart)).length

			const i = this.invuln.getInvulns('all', buffStart, buffEnd, 'invulnerable')
			this.debug(i)
			return targetableEnemies
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
=======
		// Expect one extra GCD if we had muse up for this RS
		return isMuseUp ? 1 : 0
	}
}
>>>>>>> initial RS buffwindow
