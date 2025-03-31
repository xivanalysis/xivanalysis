import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {TransMarkdown} from 'components/ui/TransMarkdown'
import {BASE_GCD} from 'data/CONSTANTS'
import {Report} from 'report'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'
import {SimpleStatistic, Statistics} from './Statistics'

const estimateHelp: Record<Report['meta']['source'] | '__all', MessageDescriptor> = {
	__all: msg({id: 'core.gcd.no-statistics.v2', message: 'This GCD recast is an *estimate*, and may be incorrect. If it is reporting a GCD recast *longer* than reality, you likely need to focus on keeping your GCD rolling.'}),
	legacyFflogs: msg({id: 'core.gcd.estimate-help.fflogs', message: 'Precise attribute values are only available from FF Logs for the player who logged the report in ACT.'}),
}

export class GlobalCooldown extends Analyser {
	static override handle = 'gcd'

	@dependency private data!: Data
	@dependency private statistics!: Statistics
	@dependency private speedAdjustments!: SpeedAdjustments

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Get the base recast time of the parsed actor's GCD cooldown group, in milliseconds.
	 * The value returned from this function _may_ be an estimate - check {@link GlobalCooldown.isEstimated}
	 * to see if it is.
	 */
	public getDuration() {
		return this.speedAdjustments.getAdjustedDuration({duration: BASE_GCD})
	}

	/** Returns whether the GCD duration calculated by this module is an estimate. */
	public isEstimated() {
		return this.speedAdjustments.isAdjustmentEstimated()
	}

	private onComplete() {
		const estimated = this.isEstimated()

		this.statistics.add(new SimpleStatistic({
			title: estimated
				? <Trans id="core.gcd.estimated-gcd">Estimated GCD</Trans>
				: <Trans id="core.gcd.gcd">GCD Recast</Trans>,
			icon: this.data.actions.ATTACK.icon,
			value: this.parser.formatDuration(this.getDuration()),
			info: estimated ? <>
				<TransMarkdown source={estimateHelp.__all}/>
				<TransMarkdown source={estimateHelp[this.parser.report.meta.source]}/>
			</> : undefined,
		}))
	}
}
