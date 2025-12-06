import {Plural, Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

export interface EsteemUsageEvaluatorOpts {
    suggestionIcon: string
    esteemActionIds: number[]
    esteemActionIds90: number[]
    esteemActionIds80: number[]
    equivalentActionIds: number[]
    actorLevelFunc: () => number | undefined
}

export class EsteemUsageEvaluator extends RulePassedEvaluator  {
	private suggestionIcon: string
	private esteemActionIds: number[]
	private esteemActionIds90: number[]
	private esteemActionIds80: number[]
	private equivalentActionIds: number[]
	private actorLevelFunc: () => number | undefined

	override header = undefined

	constructor(opts: EsteemUsageEvaluatorOpts) {
		super()

		this.suggestionIcon = opts.suggestionIcon
		this.esteemActionIds = opts.esteemActionIds
		this.esteemActionIds90 = opts.esteemActionIds90
		this.esteemActionIds80 = opts.esteemActionIds80
		this.equivalentActionIds = opts.equivalentActionIds
		this.actorLevelFunc = opts.actorLevelFunc
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		let fullPotencyLivingShadow = true
		let idsToUse = this.esteemActionIds

		// Calling actorLevelFunc at this stage should give us a real level.
		// If in doubt, assume current level.
		const playerLevel = this.actorLevelFunc()
		if (playerLevel && playerLevel < 100) {
			idsToUse = this.esteemActionIds90
		}

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		if (playerLevel && playerLevel < 90) {
			idsToUse = this.esteemActionIds80
		}

		let requiredEquivalents = 0

		// For each Esteem action we expect to see exactly one per window.
		idsToUse.forEach(esteemActionId => {
			const numberOfUsages = window.data.filter(action => action.action.id === esteemActionId).length
			// We want usually exactly one of each. Duplicates mean that the boss went out of range and we got a double
			// Abyssal Drain or something, and missing actions likely mean phase or interruption.
			// Double Abyssal is okay if and only if it replaces an equivalent action.
			if (numberOfUsages === 0) {
				// If we're missing, for example, an Edge of Shadow
				if (this.equivalentActionIds.includes(esteemActionId)) {
					requiredEquivalents++
				} else {
					fullPotencyLivingShadow = false
				}
			}
			if (numberOfUsages > 1) {
				// If we have, for example, two Abyssal Drains
				if (this.equivalentActionIds.includes(esteemActionId)) {
					requiredEquivalents -= (numberOfUsages - 1)
				} else {
					fullPotencyLivingShadow = false
				}
			}
		})

		// If requiredEquivalents is greater than 0 at the end, we missed one of the 'equivalent'
		// actions.
		if (requiredEquivalents > 0) {
			fullPotencyLivingShadow = false
		}

		return fullPotencyLivingShadow
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const badLivingShadows = this.failedRuleCount(windows)

		const severityTiers  = {
			1: SEVERITY.MEDIUM,
			2: SEVERITY.MAJOR,
		}

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="drk.esteem.nonstandard.rotation">
				<DataLink action="LIVING_SHADOW" showTooltip={true} showIcon={false}/> lost potency due to either not executing its full rotation or being interrupted, such as by being out of range part way through. <DataLink action="LIVING_SHADOW"showTooltip={true} showIcon={false}/> accounts for a lot of your damage, make sure to use it when it will be able to execute its full rotation, and in a position where it will not become out of range.
			</Trans>,
			tiers: severityTiers,
			value: badLivingShadows,
			why: <Trans id="drk.esteem.nonstandard.rotation.why">
				<Plural value={badLivingShadows} one="# Living Shadow" other="# Living Shadows"/> lost potency due to Esteem having its rotation interrupted by downtime or range.
			</Trans>,
		})
	}
}
