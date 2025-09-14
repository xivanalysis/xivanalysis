import {Plural, Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DEFAULT_SEVERITY_TIERS} from 'parser/jobs/dnc/CommonData'

export interface EsteemUsageEvaluatorOpts {
    suggestionIcon: string
    esteemActionIds: number[]
}

export class EsteemUsageEvaluator extends RulePassedEvaluator {
	private suggestionIcon: string
	 private esteemActionIds: number[]

	override header = undefined

	constructor(opts: EsteemUsageEvaluatorOpts) {
		super()
		console.error("test")

		this.suggestionIcon = opts.suggestionIcon
		this.esteemActionIds = opts.esteemActionIds
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		let correctActions = 0

		//const duplicatedActions = 0
		this.esteemActionIds.forEach(id => {
			const numberOfUsages = window.data.filter(action => action.action.id === id).length
			// We want exactly one of each. Duplicates mean that the boss went out of range and we got a double
			// Abyssal Drain or something, and missing actions likely mean phase or interruption.
			if (numberOfUsages === 1) {
				correctActions++
			}
			// if (numberOfUsages > 1) {
			// 	// eslint-disable-next-line no-console
			// 	console.log("hi2")
			// 	duplicatedActions++
			// }
		})

		// if (duplicatedActions > 0) {
		// 	// TODO Elaborate why in error -- range issue
		// 	return true
		// }

		if (correctActions === this.esteemActionIds.length) {
			return true
		}

		return false
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const badLivingShadows = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="drk.esteem.nonstandard.rotation">
				<DataLink action="LIVING_SHADOW" showTooltip={true} showIcon={false}/> did not execute its full rotation, or was interrupted. <DataLink action="LIVING_SHADOW"showTooltip={true} showIcon={false}/> accounts for a lot of your damage, make sure to use it when it will be able to execute its full rotation.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: badLivingShadows,
			why: <Trans id="drk.esteem.nonstandard.rotation.why">
				<Plural value={badLivingShadows} one="# Living Shadow" other="# Living Shadows"/> resulted in Esteem having its rotation interrupted by downtime or range.
			</Trans>,
		})
	}
}
