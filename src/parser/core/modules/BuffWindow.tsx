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
	expectedGCDs: number

	constructor(start: number, expectedGCDs: number) {
		this.start = start
		this.expectedGCDs = expectedGCDs
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

interface BuffWindowExpectedGCDs {
	expectedPerWindow: number,
	suggestionContent: TODO,
	severityTiers: object,
}

interface BuffWindowRequiredGCDs {
	iconAction: ActionData
	actions: ActionData[]
	suggestionContent: TODO
	severityTiers: object
}

interface BuffWindowTrackedCooldown {
	action: ActionData
	expectedPerWindow: number,
	suggestionContent: TODO
	severityTiers: object
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
		this.addHook('removebuff', {by: 'player'}, this.onRemoveBuff)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const action: ActionData | undefined = getDataBy(ACTIONS, 'id', event.ability.guid)

		if (!action || action.autoAttack) {
			return
		}

		if (action === this.buffAction) {
			this.startNewBuffWindow(event.timestamp)
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.rotation.push(event)
		}
	}

	private startNewBuffWindow(startTime: number) {
		if ( !this.expectedGCDs ) {
			return
		}

		let expectedGCDs = this.expectedGCDs.expectedPerWindow
		const fightTimeRemaining = this.parser.fight.end_time - startTime
		if ( this.buffStatus && this.buffStatus.duration ) {
			const windowDurationMillis = this.buffStatus.duration * 1000
			if ( windowDurationMillis >= fightTimeRemaining ) {
				const gcdEstimate = this.globalCooldown.getEstimate()
				const reducedWindow = Math.ceil((windowDurationMillis - fightTimeRemaining) / gcdEstimate)
				expectedGCDs -= reducedWindow
			}
		}
		this.buffWindows.push(new BuffWindowState(startTime, expectedGCDs))
	}

	private onRemoveBuff(event: BuffEvent) {
		if (!this.buffStatus || event.ability.guid !== this.buffStatus.id) {
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.end = event.timestamp
		}
	}

	private onComplete() {
		if ( this.buffAction && this.expectedGCDs ) {
			const missedGCDs = this.buffWindows
				.reduce((sum, curWindow) => sum + Math.max(0, curWindow.expectedGCDs - curWindow.gcds), 0)

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
						expected: buffWindow.expectedGCDs,
					}
				}

				if ( this.requiredGCDs ) {
					const allowedGCDsById = this.requiredGCDs.actions.map(a => a.id)
					targetsData.badgcd = {
						actual: buffWindow.getActionCountByIds(allowedGCDsById),
						expected: buffWindow.expectedGCDs,
					}
				}

				if ( this.trackedCooldowns ) {
					this.trackedCooldowns.forEach((cooldown) => {
						targetsData[cooldown.action.name] = {
							actual: buffWindow.getActionCountByIds([cooldown.action.id]),
							expected: cooldown.expectedPerWindow,
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
