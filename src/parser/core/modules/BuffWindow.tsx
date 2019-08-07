import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableTargetData} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import {Action} from 'data/ACTIONS/ACTIONS'
import {getDataBy} from 'data/getDataBy'
import {Status} from 'data/STATUSES/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import GlobalCooldown from 'parser/core/modules/GlobalCooldown'
import Suggestions, {TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

class BuffWindowState {
	start: number
	end?: number
	rotation: CastEvent[] = []

	constructor(start: number) {
		this.start = start
	}

	get gcds(): number {
		return this.rotation
			.map(e => getDataBy(ACTIONS, 'id', e.ability.guid) as TODO)
			.filter(a => a && a.onGcd)
			.length
	}

	getActionCountByIds(actionsById: number[]): number {
		return this.rotation
			.filter(e => actionsById.includes(e.ability.guid))
			.length
	}
}

interface SeverityTiers {
	[key: number]: number
}

interface BuffWindowExpectedGCDs {
	expectedPerWindow: number
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

interface BuffWindowRequiredGCDs {
	iconAction: Action
	actions: Action[]
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

interface BuffWindowTrackedCooldown {
	action: Action
	expectedPerWindow: number,
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

export abstract class BuffWindowModule extends Module {
	static handle: string = 'buffwindow'
	static title: MessageDescriptor = t('core.buffwindow.title')`Buff Window`

	/**
	 * Implementing modules MUST define the ACTION object for the action that initiates the buff window
	 */
	abstract buffAction: Action
	/**
	 * Implementing modules MUST define the STATUS object for the status that represents the buff window
	 */
	abstract buffStatus: Status

	/**
	 * Most implementing modules will pass an expectedGCDs object to indicate the number of GCDs expected within the buff window
	 * 	 and the suggestion "content" copy and severity tiers for failing to meet the number of expected GCDs.
	 */
	protected expectedGCDs?: BuffWindowExpectedGCDs
	/**
	 * Optionally, you can also specify requiredGCDs to indicate that all GCDs used within the buff window MUST be one of the skills
	 *   designated in the requiredGCDs.actions array
	 */
	protected requiredGCDs?: BuffWindowRequiredGCDs
	/**
	 * Optionally, you can also specify additional cooldowns to track usage of, indicating the number of expected usages per window.
	 * - trackedCooldowns will require a MINIMUM of trackedCooldown.expectedPerWindow uses of the specified action in each window
	 *     and will provide data in the RotationTable about the number used as well as a suggestion based on missed uses
	 */
	protected trackedCooldowns: BuffWindowTrackedCooldown[] = []
	/**
	 * Optionally, you can also specify additional cooldowns to track usage of, indicating the number of expected usages per window.
	 *  - trackedBadCooldowns will require NO MORE THAN trackedBadCooldown.expectedPerWindow uses of the specified action in each window
	 *     (usually, this number should be 0), and will provide a suggestion if the BadCooldown is being used more than the expected threshold
	 */
	protected trackedBadCooldowns: BuffWindowTrackedCooldown[] = []

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private globalCooldown!: GlobalCooldown

	private buffWindows: BuffWindowState[] = []

	private get activeBuffWindow(): BuffWindowState | undefined {
		const lastBuffWindow = _.last(this.buffWindows)
		if ( lastBuffWindow && lastBuffWindow.end == null ) {
			return lastBuffWindow
		}
		return undefined
	}

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('applybuff', {by: 'player'}, this.onApplyBuff)
		this.addHook('removebuff', {by: 'player'}, this.onRemoveBuff)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const action: Action | undefined = getDataBy(ACTIONS, 'id', event.ability.guid)

		if (!action || action.autoAttack) {
			// Disregard auto attacks for tracking rotations / events during buff windows
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.rotation.push(event)
		}
	}

	private onApplyBuff(event: BuffEvent) {
		if (!this.buffStatus || event.ability.guid !== this.buffStatus.id) {
			return
		}

		this.startNewBuffWindow(event.timestamp)
	}

	private startNewBuffWindow(startTime: number) {
		this.buffWindows.push(new BuffWindowState(startTime))
	}

	private onRemoveBuff(event: BuffEvent) {
		if (!this.buffStatus || event.ability.guid !== this.buffStatus.id) {
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.end = event.timestamp
		}
	}

	/**
	 * For consumers that have the same number of expected GCDs per window, this will use the expectedPerWindow property
	 *   on expectedGCDs as the baseline
	 * This method MAY be overridden if the logic of expected GCDs per window is variable
	 * @param buffWindow
	 */
	protected getBaselineExpectedGCDs(buffWindow: BuffWindowState): number {
		if ( this.expectedGCDs ) {
			return this.expectedGCDs.expectedPerWindow
		}
		return 0
	}

	/**
	 * This method MAY be overridden to provide class-specific rushing logic per BuffWindow - default is no effect
	 * Return a positive number to INCREASE expected GCDs for this window, or a negative number to DECREASE
	 * @param buffWindow
	 */
	protected changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
		return 0
	}

	/**
	 * Handles rushing logic to reduce expected GCDs in a window for end of fight rushing
	 * This method MAY be overridden if class rules for end of fight rushing vary
	 * @param buffWindow
	 */
	protected reduceExpectedGCDsEndOfFight(buffWindow: BuffWindowState): number {
		if ( this.buffStatus.duration ) {
			// Check to see if this window is rushing due to end of fight - reduce expected GCDs accordingly
			const windowDurationMillis = this.buffStatus.duration * 1000
			const fightTimeRemaining = this.parser.fight.end_time - buffWindow.start

			if (windowDurationMillis >= fightTimeRemaining) {
				const gcdEstimate = this.globalCooldown.getEstimate()
				return Math.ceil((windowDurationMillis - fightTimeRemaining) / gcdEstimate)
			}
		}

		// Default: no rushing reduction
		return 0
	}

	/**
	 * For consumers that have tracked cooldowns that expect the same number of usages per window, this will use the
	 *   expectedPerWindow property on that cooldown as the baseline
	 * This method MAY be overridden if the logic of expected tracked cooldowns per window is variable
	 * @param buffWindow
	 * @param cooldown
	 */
	protected getBaselineExpectedTrackedCooldown(buffWindow: BuffWindowState, cooldown: BuffWindowTrackedCooldown): number {
		return cooldown.expectedPerWindow || 0
	}

	/**
	 * This method MAY be overridden to provide class-specific logic to change expected uses of a tracked cooldown per BuffWindow - default no effect
	 * Return a positive number to INCREASE expected tracked cooldown usages for this window, or a negative number to DECREASE
	 * @param buffWindow
	 * @param cooldown
	 */
	protected changeExpectedTrackedCooldownClassLogic(buffWindow: BuffWindowState, cooldown: BuffWindowTrackedCooldown): number {
		return 0
	}

	private getBuffWindowExpectedGCDs(buffWindow: BuffWindowState): number {
		return this.getBaselineExpectedGCDs(buffWindow) + this.changeExpectedGCDsClassLogic(buffWindow) - this.reduceExpectedGCDsEndOfFight(buffWindow)
	}

	private getBuffWindowExpectedTrackedCooldowns(buffWindow: BuffWindowState, cooldown: BuffWindowTrackedCooldown): number {
		return this.getBaselineExpectedTrackedCooldown(buffWindow, cooldown) + this.changeExpectedTrackedCooldownClassLogic(buffWindow, cooldown)
	}

	private onComplete() {
		if ( this.expectedGCDs ) {
			const missedGCDs = this.buffWindows
				.reduce((sum, curWindow) => {
					const expectedGCDs = this.getBuffWindowExpectedGCDs(curWindow)
					return sum + Math.max(0, expectedGCDs - curWindow.gcds)
				}, 0)

			this.suggestions.add(new TieredSuggestion({
				icon: this.buffAction.icon,
				content: this.expectedGCDs.suggestionContent,
				tiers: this.expectedGCDs.severityTiers,
				value: missedGCDs,
				why: <Trans id="core.buffwindow.suggestions.missedgcd.why">
					{missedGCDs} <Plural value={missedGCDs} one="GCD was" other="GCDs were" /> missed during {this.buffAction.name} windows.
				</Trans>,
			}))
		}

		if ( this.requiredGCDs ) {
			const allowedGCDsById = this.requiredGCDs.actions.map(a => a.id)
			const invalidGCDs = this.buffWindows
				.reduce((sum, curWindow) => sum + Math.max(0, curWindow.gcds - curWindow.getActionCountByIds(allowedGCDsById)), 0)

			this.suggestions.add(new TieredSuggestion({
				icon: this.requiredGCDs.iconAction.icon,
				content: this.requiredGCDs.suggestionContent,
				tiers: this.requiredGCDs.severityTiers,
				value: invalidGCDs,
				why: <Trans id="core.buffwindow.suggestions.badgcd.why">
					{invalidGCDs} incorrect <Plural value={invalidGCDs} one="GCD was" other="GCDs were" /> used during {this.buffAction.name} windows.
				</Trans>,
			}))
		}

		this.trackedCooldowns.forEach(cooldown => {
			const missedCooldowns = this.buffWindows
				.reduce((sum, curWindow) => sum + Math.max(0, cooldown.expectedPerWindow - curWindow.getActionCountByIds([cooldown.action.id])), 0)

			this.suggestions.add(new TieredSuggestion({
				icon: cooldown.action.icon,
				content: cooldown.suggestionContent,
				tiers: cooldown.severityTiers,
				value: missedCooldowns,
				why: <Trans id="core.buffwindow.suggestions.trackedcooldown.why">
					{missedCooldowns} <Plural value={missedCooldowns} one="use of" other="uses of"/> <ActionLink showIcon={false} {...cooldown.action}/> <Plural value={missedCooldowns} one="was" other="were"/> missed during {this.buffAction.name} windows.
				</Trans>,
			}))
		})

		this.trackedBadCooldowns.forEach(badCooldown => {
			const badCooldowns = this.buffWindows
				.reduce((sum, curWindow) => sum + Math.max(0, curWindow.getActionCountByIds([badCooldown.action.id])), 0)

			this.suggestions.add(new TieredSuggestion({
				icon: badCooldown.action.icon,
				content: badCooldown.suggestionContent,
				tiers: badCooldown.severityTiers,
				value: badCooldowns,
				why: <Trans id="core.buffwindow.suggestions.badcooldown.why">
					{badCooldowns} <Plural value={badCooldowns} one="use of" other="uses of"/> <ActionLink showIcon={false} {...badCooldown.action}/> during {this.buffAction.name} windows.
				</Trans>,
			}))
		})
	}

	output() {
		const rotationTargets = []

		if ( this.expectedGCDs ) {
			rotationTargets.push({
				header: <Trans id="core.buffwindow.table.header.gcds">GCDs</Trans>,
				accessor: 'missedgcd',
			})
		}
		if ( this.requiredGCDs ) {
			rotationTargets.push({
				header: <ActionLink showName={false} {...this.requiredGCDs.iconAction}/>,
				accessor: 'badgcd',
			})
		}
		this.trackedCooldowns.forEach((cooldown) => {
			rotationTargets.push({
				header: <ActionLink showName={false} {...cooldown.action}/>,
				accessor: cooldown.action.name,
			})
		})

		const rotationData = this.buffWindows
			.map(buffWindow => {
				const windowStart = buffWindow.start - this.parser.fight.start_time
				const windowEnd = (buffWindow.end != null ? buffWindow.end : buffWindow.start) - this.parser.fight.start_time
				const targetsData: RotationTableTargetData = {}

				if ( this.expectedGCDs ) {
					targetsData.missedgcd = {
						actual: buffWindow.gcds,
						expected: this.getBuffWindowExpectedGCDs(buffWindow),
					}
				}

				if ( this.requiredGCDs ) {
					const allowedGCDsById = this.requiredGCDs.actions.map(a => a.id)
					targetsData.badgcd = {
						actual: buffWindow.getActionCountByIds(allowedGCDsById),
						expected: this.getBuffWindowExpectedGCDs(buffWindow),
					}
				}

				if ( this.trackedCooldowns ) {
					this.trackedCooldowns.forEach((cooldown) => {
						targetsData[cooldown.action.name] = {
							actual: buffWindow.getActionCountByIds([cooldown.action.id]),
							expected: this.getBuffWindowExpectedTrackedCooldowns(buffWindow, cooldown),
						}
					})
				}

				return {
					start: windowStart,
					end: windowEnd,
					targetsData,
					rotation: buffWindow.rotation,
				}
			})

		return <RotationTable
			targets={rotationTargets}
			data={rotationData}
			onGoto={this.timeline.show}
		/>
	}
}
