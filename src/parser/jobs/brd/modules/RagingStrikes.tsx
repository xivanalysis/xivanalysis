import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {Action} from 'data/ACTIONS'
import {ActionRoot} from 'data/ACTIONS/root'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import {BuffWindowModule, BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isDefined} from 'utilities'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Minimum muse GCDs needed to expect an RS window to have 9 GCDs
const MIN_MUSE_GCDS = 3

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

interface MuseWindow {
	start: number,
	end?: number | undefined,
}

export default class RagingStrikes extends BuffWindowModule {
	static override handle = 'rs'
	static override title = t('brd.rs.title')`Raging Strikes`
	static override displayOrder = DISPLAY_ORDER.RAGING_STRIKES

	buffAction = this.data.actions.RAGING_STRIKES
	buffStatus = this.data.statuses.RAGING_STRIKES

	private museHistory: MuseWindow[] = []
	private SUPPORT_ACTIONS: number[] = []

	override expectedGCDs = {
		expectedPerWindow: 8,
		suggestionContent: <Trans id="brd.rs.suggestions.missedgcd.content">
			Try to land 8 GCDs (9 GCDs with <StatusLink {...this.data.statuses.ARMYS_MUSE}/>) during every <ActionLink {...this.data.actions.RAGING_STRIKES}/> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	override trackedActions = {
		icon: this.data.actions.BARRAGE.icon,
		actions: [
			{
				action: this.data.actions.BARRAGE,
				status: this.data.statuses.BARRAGE,
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

	protected override init() {
		super.init()

		this.SUPPORT_ACTIONS = SUPPORT_ACTIONS.map(actionKey => this.data.actions[actionKey].id)
		this.addEventHook('applybuff', {to: 'player', abilityId: [this.data.statuses.ARMYS_MUSE.id]}, this.onApplyMuse)
		this.addEventHook('removebuff', {to: 'player', abilityId: [this.data.statuses.ARMYS_MUSE.id]}, this.onRemoveMuse)
	}

	private get activeMuse(): MuseWindow | undefined {
		const last = _.last(this.museHistory)
		if (last && !isDefined(last.end)) {
			return last
		}
		return undefined
	}

	private onApplyMuse(event: BuffEvent) {
		this.museHistory.push({start: event.timestamp})
	}

	private onRemoveMuse(event: BuffEvent) {
		if (this.activeMuse) {
			this.activeMuse.end = event.timestamp
		}
	}

	protected override considerAction = (action: Action) => !this.SUPPORT_ACTIONS.includes(action.id)

	protected override changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
		// Check if muse was up for at least 3 GCDs in this buffWindow
		const museOverlap = this.museHistory.some(muse => (
			buffWindow.rotation.filter(event => this.data.getAction(event.ability.guid)?.onGcd &&
					event.timestamp > muse.start && (!muse.end || event.timestamp < muse.end))
				.length >= MIN_MUSE_GCDS
		))

		return museOverlap ? 1 : 0
	}

	private getEventTargetKey = (event: CastEvent): string => `${event.targetID}-${event.targetInstance}`

	protected override getBaselineExpectedTrackedAction(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
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

	protected override reduceTrackedActionsEndOfFight(buffWindow: BuffWindowState): number {
		const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)

		/**
		 * IJ definitely shouldn't be used at the end of the fight, so reduce by 1
		 * Barrage might have floated to the end of the RS window, so reduce by 1
		 */
		if (this.buffStatus.duration >= fightTimeRemaining) {
			return 1
		}

		return 0
	}

	protected override changeComparisonClassLogic(buffWindow: BuffWindowState, action: BuffWindowTrackedAction) {
		/**
		 * Positive only if we had exactly one Iron Jaws in this RS
		 * If expected > 1, we're in AoE and there is no clear rotation target, so don't highlight this cell
		 */
		if (action.action === this.data.actions.IRON_JAWS) {
			return (actual: number, expected?: number) => {
				if (!isDefined(expected) || expected > 1) {
					return RotationTargetOutcome.NEUTRAL
				}

				if (actual === expected) {
					return RotationTargetOutcome.POSITIVE
				}

				return RotationTargetOutcome.NEGATIVE
			}
		}
	}
}
