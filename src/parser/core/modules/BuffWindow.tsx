import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableNotesMap, RotationTableTargetData, RotationTargetOutcome} from 'components/ui/RotationTable'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import GlobalCooldown from 'parser/core/modules/GlobalCooldown'
import Suggestions, {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {ensureArray} from 'utilities'
import {Data} from './Data'

export class BuffWindowState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	expiredStatuses: BuffEvent[] = []
	status: Status

	private data: Data

	constructor(data: Data, start: number, status: Status) {
		this.data = data
		this.start = start
		this.status = status
	}

	get gcds(): number {
		// TODO: Investigate removing the reliance on data here.
		return this.rotation
			.map(e => this.data.getAction(e.ability.guid))
			.filter(a => a && a.onGcd)
			.length
	}

	getActionCountByIds(actionsById: number[]): number {
		return this.rotation
			.filter(e => actionsById.includes(e.ability.guid))
			.length
	}

	getTrackedActionCount(action: BuffWindowTrackedAction): number {
		if (action.status) {
			const gcdTimestamps = this.rotation
				.filter(e => this.data.getAction(e.ability.guid)?.onGcd)
				.map(e => e.timestamp)

			// Check to make sure at least one GCD happened before the status expired
			return this.expiredStatuses
				.filter(e => e.ability.guid === action.status?.id &&
					gcdTimestamps.some(t => t <= e.timestamp))
				.length
		}

		return this.getActionCountByIds([action.action.id])
	}
}

interface SeverityTiers {
	[key: number]: number
}

export interface BuffWindowExpectedGCDs {
	expectedPerWindow: number
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

interface BuffWindowRequiredGCDs {
	icon: string
	actions: Action[]
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

interface BuffWindowTrackedActions {
	actions: BuffWindowTrackedAction[]
	icon: string
	suggestionContent: JSX.Element | string
	severityTiers: SeverityTiers
}

export interface BuffWindowTrackedAction {
	action: Action
	/**
	 * Implementing modules can optionally specify a Status if the trackedAction is a weaponskill modifier
	 * (e.g. Barrage, Life Surge, Reassemble)
	 */
	status?: Status
	expectedPerWindow: number
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
	abstract buffStatus: Status | Status[]

	/**
	 * Converted buffStatus, computed once at component init
	 */
	private buffStatusArray: readonly Status[] = []

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
	 * Optionally, you can also specify additional actions to track usage of, indicating the number of expected usages per window.
	 * - trackedActions will require a MINIMUM of trackedAction.expectedPerWindow uses of the specified action in each window
	 *     and will provide data in the RotationTable about the number used as well as a suggestion based on missed uses
	 */
	protected trackedActions?: BuffWindowTrackedActions
	/**
	 * Optionally, you can also specify additional cooldowns to track usage of, indicating the number of expected usages per window.
	 *  - trackedBadActions will require NO MORE THAN trackedBadAction.expectedPerWindow uses of the specified action in each window
	 *     (usually, this number should be 0), and will provide a suggestion if the BadAction is being used more than the expected threshold
	 */
	protected trackedBadActions?: BuffWindowTrackedActions
	/**
	 * Optionally, you can also specify pet actions to track. These actions will show up in the rotation section and can be
	 *   included in trackedActions
	 */
	protected petActions?: Action[]
	/**
	 * Implementing modules MAY provide a value to override the "Rotation" title in the header of the rotation section
	 * If implementing, you MUST provide a JSX.Element <Trans> or <Fragment> tag (Trans tag preferred)
	 */
	protected rotationTableHeader?: JSX.Element
	/**
	 * Implementing modules MAY provide a value to set the "Notes" title in the header of the notes section
	 * The notes section will be output in the rotation table to the right of the Rotation column
	 * If implementing, you MUST provide a JSX.Element <Trans> or <Fragment> tag (Trans tag preferred)
	 * If you implement a Notes column header, you MUST also override the getBuffWindowNotes function to provide the note to display per window
	 */
	protected rotationTableNotesColumnHeader?: JSX.Element

	@dependency protected data!: Data
	@dependency protected globalCooldown!: GlobalCooldown
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private buffWindows: BuffWindowState[] = []

	private get activeBuffWindow(): BuffWindowState | undefined {
		const lastBuffWindow = _.last(this.buffWindows)
		if (lastBuffWindow && lastBuffWindow.end == null) {
			return lastBuffWindow
		}
		return undefined
	}

	protected init() {
		// ensure array
		this.buffStatusArray = ensureArray(this.buffStatus)

		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('applybuff', {to: 'player'}, this.onApplyBuff)
		this.addEventHook('removebuff', {to: 'player'}, this.onRemoveBuff)
		this.addEventHook('complete', this.onComplete)

		if (this.petActions && this.petActions.length) {
			this.addEventHook('cast', {by: 'pet', abilityId: this.petActions.map(a => a.id)}, this.onCast)
		}
	}

	private onCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)

		if (!action || action.autoAttack) {
			// Disregard auto attacks for tracking rotations / events during buff windows
			return
		}

		if (this.activeBuffWindow && this.considerAction(action)) {
			this.activeBuffWindow.rotation.push(event)
		}
	}

	/**
	 * This method MAY be overridden to return true or false, indicating whether or not this action should be considered within the buff window
	 * If false is returned, the action will not be tracked AT ALL within the buff window, and will NOT appear within the Rotation column
	 * @param action
	 */
	protected considerAction(_action: Action) {
		return true
	}

	private onApplyBuff(event: BuffEvent) {
		const status = this.buffStatusArray.find(s => event.ability.guid === s.id)

		if (!this.buffStatus || !status) {
			return
		}

		if (this.activeBuffWindow === undefined) {
			this.startNewBuffWindow(event.timestamp, status)
		}
	}

	private startNewBuffWindow(startTime: number, status: Status) {
		this.buffWindows.push(new BuffWindowState(this.data, startTime, status))
	}

	private onRemoveBuff(event: BuffEvent) {
		if (!this.buffStatus) {
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.expiredStatuses.push(event)

			if (this.buffStatusArray.find(s => event.ability.guid === s.id)) {
				this.activeBuffWindow.end = event.timestamp
			}
		}
	}

	/**
	 * For consumers that have the same number of expected GCDs per window, this will use the expectedPerWindow property
	 *   on expectedGCDs as the baseline
	 * This method MAY be overridden if the logic of expected GCDs per window is variable
	 * @param buffWindow
	 */
	protected getBaselineExpectedGCDs(_buffWindow: BuffWindowState): number {
		if (this.expectedGCDs) {
			return this.expectedGCDs.expectedPerWindow
		}
		return 0
	}

	/**
	 * This method MAY be overridden to provide class-specific rushing logic per BuffWindow - default is no effect
	 * Return a positive number to INCREASE expected GCDs for this window, or a negative number to DECREASE
	 * @param buffWindow
	 */
	protected changeExpectedGCDsClassLogic(_buffWindow: BuffWindowState): number {
		return 0
	}

	/**
	 * Handles rushing logic to reduce expected GCDs in a window for end of fight rushing
	 * This method MAY be overridden if class rules for end of fight rushing vary
	 * @param buffWindow
	 */
	protected reduceExpectedGCDsEndOfFight(buffWindow: BuffWindowState): number {
		// the applied status is saved to the window, so we just use the duration in that object
		if (buffWindow.status.duration) {
			// Check to see if this window is rushing due to end of fight - reduce expected GCDs accordingly
			const windowDurationMillis = buffWindow.status.duration * 1000
			const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)

			if (windowDurationMillis >= fightTimeRemaining) {
				const gcdEstimate = this.globalCooldown.getEstimate()
				return Math.ceil((windowDurationMillis - fightTimeRemaining) / gcdEstimate)
			}
		}

		// Default: no rushing reduction
		return 0
	}

	/**
	 * Handles rushing logic to reduce tracked actions in a window for end of fight rushing
	 * This method MAY be overridden if class rules for end of fight rushing vary
	 * @param buffWindow
	 * @param action
	 */
	protected reduceTrackedActionsEndOfFight(_buffWindow: BuffWindowState, _action: BuffWindowTrackedAction): number {
		return 0
	}

	/**
	 * For consumers that have tracked actions that expect the same number of usages per window, this will use the
	 *   expectedPerWindow property on that action as the baseline
	 * This method MAY be overridden if the logic of expected tracked actions per window is variable
	 * @param buffWindow
	 * @param action
	 */
	protected getBaselineExpectedTrackedAction(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		return action.expectedPerWindow || 0
	}

	/**
	 * This method MAY be overridden to provide class-specific logic to change expected uses of a tracked action per BuffWindow - default no effect
	 * Return a positive number to INCREASE expected tracked action usages for this window, or a negative number to DECREASE
	 * @param buffWindow
	 * @param action
	 */
	protected changeExpectedTrackedActionClassLogic(_buffWindow: BuffWindowState, _action: BuffWindowTrackedAction): number {
		return 0
	}

	private getBuffWindowExpectedGCDs(buffWindow: BuffWindowState): number {
		return this.getBaselineExpectedGCDs(buffWindow) + this.changeExpectedGCDsClassLogic(buffWindow) - this.reduceExpectedGCDsEndOfFight(buffWindow)
	}

	/**
	 * Implementing modules MAY provide class-specific logic to change the highlighting of tracked action uses per BuffWindow
	 * Return a function that consumes expected and actual uses and returns a RotationTargetOutcome
	 * @param buffWindow
	 * @param action
	 */
	protected changeComparisonClassLogic(_buffWindow: BuffWindowState, _action: BuffWindowTrackedAction):
	((actual: number, expected?: number) => RotationTargetOutcome) | undefined {
		return undefined
	}

	/**
	 * This method MAY be overridden to provide class-specific logic to determine if the required GCD(s) were used during a given BuffWindow
	 * Classes whose required GCD list vary per window should override this function.
	 * Function MUST return a number of CORRECT GCDs used within the window
	 * @param buffWindow
	 */
	protected getBuffWindowRequiredGCDsUsed(buffWindow: BuffWindowState): number {
		if (!this.requiredGCDs) {
			return 0
		}

		const allowedGCDsById = this.requiredGCDs.actions.map(a => a.id)
		return buffWindow.getActionCountByIds(allowedGCDsById)
	}

	private getBuffWindowExpectedTrackedActions(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		return this.getBaselineExpectedTrackedAction(buffWindow, action) + this.changeExpectedTrackedActionClassLogic(buffWindow, action) -
				this.reduceTrackedActionsEndOfFight(buffWindow, action)
	}

	/**
	 * This method will be called if and only if the rotationTableNotesColumnHeader property is set, to add a notes field for each buff window
	 * Implementing classes MUST define their logic to determine what note to display for each buff window within this method
	 * @param buffWindow
	 */
	protected getBuffWindowNotes(_buffWindow: BuffWindowState): JSX.Element | undefined {
		return undefined
	}

	/**
	 * This method will be called if and only if the buff was never used, to generate any desired output
	 * to highlight that the user did not use the buff at all.
	 * If desired, you may generate a Suggestion in this function and still return undefined to not
	 * create a table.
	 */
	protected generateBuffNotUsedOutput(): JSX.Element | undefined {
		return undefined
	}

	private countMissedTrackedActions(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		const expected = this.getBuffWindowExpectedTrackedActions(buffWindow, action)
		const comparator = this.changeComparisonClassLogic(buffWindow, action)
		const actual = buffWindow.getTrackedActionCount(action)

		// If a custom comparator is defined for this action, and it didn't return negative, don't count this window
		if (comparator && comparator(actual, expected) !== RotationTargetOutcome.NEGATIVE) { return 0 }

		return Math.max(0, expected - actual)
	}

	private onComplete() {
		if (this.expectedGCDs) {
			const missedGCDs = this.buffWindows
				.reduce((sum, buffWindow) => {
					const expectedGCDs = this.getBuffWindowExpectedGCDs(buffWindow)
					return sum + Math.max(0, expectedGCDs - buffWindow.gcds)
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

		if (this.requiredGCDs) {
			const invalidGCDs = this.buffWindows
				.reduce((sum, buffWindow) => sum + Math.max(0, buffWindow.gcds - this.getBuffWindowRequiredGCDsUsed(buffWindow)), 0)

			this.suggestions.add(new TieredSuggestion({
				icon: this.requiredGCDs.icon,
				content: this.requiredGCDs.suggestionContent,
				tiers: this.requiredGCDs.severityTiers,
				value: invalidGCDs,
				why: <Trans id="core.buffwindow.suggestions.badgcd.why">
					{invalidGCDs} incorrect <Plural value={invalidGCDs} one="GCD was" other="GCDs were" /> used during {this.buffAction.name} windows.
				</Trans>,
			}))
		}

		if (this.trackedActions) {
			const missedActions = this.trackedActions.actions
				.reduce((sum, trackedAction) => sum + this.buffWindows
					.reduce((sum, buffWindow) => sum + this.countMissedTrackedActions(buffWindow, trackedAction), 0), 0)

			this.suggestions.add(new TieredSuggestion({
				icon: this.trackedActions.icon,
				content: this.trackedActions.suggestionContent,
				tiers: this.trackedActions.severityTiers,
				value: missedActions,
				why: <Trans id="core.buffwindow.suggestions.trackedaction.why">
					<Plural value={missedActions} one="# use of a recommended action was" other="# uses of recommended actions were"/> missed during {this.buffAction.name} windows.
				</Trans>,
			}))
		}

		if (this.trackedBadActions) {
			const badActions = this.trackedBadActions.actions
				.reduce((sum, trackedAction) => sum + this.buffWindows
					.reduce((sum, buffWindow) => sum + Math.max(0, buffWindow.getTrackedActionCount(trackedAction) - trackedAction.expectedPerWindow), 0), 0)

			this.suggestions.add(new TieredSuggestion({
				icon: this.trackedBadActions.icon,
				content: this.trackedBadActions.suggestionContent,
				tiers: this.trackedBadActions.severityTiers,
				value: badActions,
				why: <Trans id="core.buffwindow.suggestions.trackedbadaction.why">
					<Plural value={badActions} one="# use of" other="# uses of"/> actions that should be avoided during {this.buffAction.name} windows.
				</Trans>,
			}))
		}
	}

	output() {
		if (this.buffWindows.length === 0) {
			return this.generateBuffNotUsedOutput()
		}

		const rotationTargets = []
		const notesData = []

		if (this.expectedGCDs) {
			rotationTargets.push({
				header: <Trans id="core.buffwindow.table.header.gcds">GCDs</Trans>,
				accessor: 'missedgcd',
			})
		}
		if (this.requiredGCDs) {
			rotationTargets.push({
				header: <img src={this.requiredGCDs.icon} alt="" style={{height: '20px'}}/>,
				accessor: 'badgcd',
			})
		}
		if (this.trackedActions) {
			this.trackedActions.actions.forEach((trackedAction) => {
				rotationTargets.push({
					header: <ActionLink showName={false} {...trackedAction.action}/>,
					accessor: trackedAction.action.name,
				})
			})
		}
		if (this.rotationTableNotesColumnHeader) {
			notesData.push({
				header: this.rotationTableNotesColumnHeader,
				accessor: 'notes',
			})
		}

		const rotationData = this.buffWindows
			.map(buffWindow => {
				const windowStart = buffWindow.start - this.parser.eventTimeOffset
				const windowEnd = (buffWindow.end != null ? buffWindow.end : buffWindow.start) - this.parser.eventTimeOffset
				const targetsData: RotationTableTargetData = {}
				const notesMap: RotationTableNotesMap = {}

				if (this.expectedGCDs) {
					targetsData.missedgcd = {
						actual: buffWindow.gcds,
						expected: this.getBuffWindowExpectedGCDs(buffWindow),
					}
				}

				if (this.requiredGCDs) {
					targetsData.badgcd = {
						actual: this.getBuffWindowRequiredGCDsUsed(buffWindow),
						expected: this.getBuffWindowExpectedGCDs(buffWindow),
					}
				}

				if (this.trackedActions) {
					this.trackedActions.actions.forEach((trackedAction) => {
						targetsData[trackedAction.action.name] = {
							actual: buffWindow.getTrackedActionCount(trackedAction),
							expected: this.getBuffWindowExpectedTrackedActions(buffWindow, trackedAction),
							targetComparator: this.changeComparisonClassLogic(buffWindow, trackedAction),
						}
					})
				}

				if (this.rotationTableNotesColumnHeader) {
					notesMap.notes = this.getBuffWindowNotes(buffWindow)
				}

				return {
					start: windowStart,
					end: windowEnd,
					targetsData,
					rotation: buffWindow.rotation,
					notesMap,
				}
			})

		return <RotationTable
			targets={rotationTargets}
			data={rotationData}
			notes={notesData}
			onGoto={this.timeline.show}
			headerTitle={this.rotationTableHeader}
		/>
	}
}
