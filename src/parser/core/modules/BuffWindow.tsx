import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableTargetData} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import {ActionData, getDataBy, StatusData} from 'data/getDataBy'
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
	iconAction: ActionData
	actions: ActionData[]
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

interface BuffWindowTrackedCooldown {
	action: ActionData
	expectedPerWindow: number,
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

export default class BuffWindowModule extends Module {
	static handle: string = 'buffwindow'
	static title: MessageDescriptor = t('core.buffwindow.title')`Buff Window`

	// Implementing modules should pass the ACTION and STATUS object respectively that represents the buff window
	protected buffAction?: ActionData
	protected buffStatus?: StatusData

	// From a practical perspective, expectedGCDs should be considered required for implementing modules.
	// Other properties can be added as desired.  trackedBadCooldowns will show suggestions if used too many times, but will not show in the rotation tables
	protected expectedGCDs?: BuffWindowExpectedGCDs
	protected requiredGCDs?: BuffWindowRequiredGCDs
	protected trackedCooldowns?: BuffWindowTrackedCooldown[]
	protected trackedBadCooldowns?: BuffWindowTrackedCooldown[]

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
		const action: ActionData | undefined = getDataBy(ACTIONS, 'id', event.ability.guid)

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

	// For consumers that have the same number of expected GCDs per window, this will use the expectedPerWindow property
	//   on expectedGCDs as the baseline.  This method can be overridden if the logic of expected GCDs per window is variable
	protected getBaselineExpectedGCDs(buffWindow: BuffWindowState): number {
		if ( this.expectedGCDs ) {
			return this.expectedGCDs.expectedPerWindow
		}
		return 0
	}

	// Override point for class-specific rushing logic per BuffWindow - default no effect
	// Return a positive number to increase expected GCDs for this window, and a negative number to decrease
	protected changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
		return 0
	}

	// Rushing handling for end of fight rushing.  Can be overridden if class rules for end of fight rushing vary
	protected reduceExpectedGCDsEndOfFight(buffWindow: BuffWindowState): number {
		if ( this.buffStatus && this.buffStatus.duration ) {
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

	// For consumers that have tracked cooldowns that expect the same number of that cooldown per window, this will use the
	//   expectedPerWindow property on that cooldown as the baseline.  This method can be overridden if the logic of
	//   expected tracked cooldowns per window is variable
	protected getBaselineExpectedTrackedCooldown(buffWindow: BuffWindowState, cooldown: BuffWindowTrackedCooldown): number {
		return cooldown.expectedPerWindow || 0
	}

	// Override point for class-specific logic to change expected uses of a tracked cooldown per BuffWindow - default no effect
	// Return a positive number to increase expected GCDs for this window, and a negative number to decrease
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
		if ( this.buffAction && this.expectedGCDs ) {
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

		if ( this.buffAction && this.requiredGCDs ) {
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

		if ( this.trackedCooldowns ) {
			this.trackedCooldowns.forEach(cooldown => {
				if ( this.buffAction ) {
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
				}
			})
		}

		if ( this.trackedBadCooldowns ) {
			this.trackedBadCooldowns.forEach(badCooldown => {
				if ( this.buffAction ) {
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
				}
			})
		}
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
		if ( this.trackedCooldowns ) {
			this.trackedCooldowns.forEach((cooldown) => {
				rotationTargets.push({
					header: <ActionLink showName={false} {...cooldown.action}/>,
					accessor: cooldown.action.name,
				})
			})
		}

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
