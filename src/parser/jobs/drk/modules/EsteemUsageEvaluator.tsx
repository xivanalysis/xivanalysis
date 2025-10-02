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
    actorLevelFunc: () => number | undefined
}

export class EsteemUsageEvaluator extends RulePassedEvaluator  {
	private suggestionIcon: string
	private esteemActionIds: number[]
	private esteemActionIds90: number[]
	private esteemActionIds80: number[]
	private actorLevelFunc: () => number | undefined

	override header = undefined

	constructor(opts: EsteemUsageEvaluatorOpts) {
		super()

		this.suggestionIcon = opts.suggestionIcon
		this.esteemActionIds = opts.esteemActionIds
		this.esteemActionIds90 = opts.esteemActionIds90
		this.esteemActionIds80 = opts.esteemActionIds80
		this.actorLevelFunc = opts.actorLevelFunc
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		let normalLivingShadow = true
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

		// For each Esteem action we expect to see exactly one per window.
		idsToUse.forEach(esteemActionId => {
			const numberOfUsages = window.data.filter(action => action.action.id === esteemActionId).length
			// We want exactly one of each. Duplicates mean that the boss went out of range and we got a double
			// Abyssal Drain or something, and missing actions likely mean phase or interruption.
			if (numberOfUsages !== 1) {
				normalLivingShadow = false
			}
		})

		return normalLivingShadow
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
				<DataLink action="LIVING_SHADOW" showTooltip={true} showIcon={false}/> did not execute its full rotation, or was interrupted, such as by being out of range part way through. <DataLink action="LIVING_SHADOW"showTooltip={true} showIcon={false}/> accounts for a lot of your damage, make sure to use it when it will be able to execute its full rotation, and in a position where it will not become out of range.
			</Trans>,
			tiers: severityTiers,
			value: badLivingShadows,
			why: <Trans id="drk.esteem.nonstandard.rotation.why">
				<Plural value={badLivingShadows} one="# Living Shadow" other="# Living Shadows"/> resulted in Esteem having its rotation interrupted by downtime or range.
			</Trans>,
		})
	}
}
