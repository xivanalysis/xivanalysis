import {Trans} from '@lingui/react'
import JOBS from 'data/JOBS'
import React from 'react'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Actors} from './Actors'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'
import {SimpleStatistic, Statistics} from './Statistics'

const BASE_GCD = 2500

export class GlobalCooldown extends Analyser {
	static override handle = 'gcd'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private statistics!: Statistics
	@dependency private speedAdjustments!: SpeedAdjustments

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	public getEstimate() {
		const jobSpeedStat = JOBS[this.parser.actor.job].speedStat
		return this.speedAdjustments.getAdjustedDuration({duration: BASE_GCD, attribute: jobSpeedStat})
	}

	private onComplete() {

		this.statistics.add(new SimpleStatistic({
			title: <Trans id="core.gcd.estimated-gcd">Estimated GCD</Trans>,
			icon: this.data.actions.ATTACK.icon,
			value: this.parser.formatDuration(this.getEstimate()),
			info: (
				<Trans id="core.gcd.no-statistics">
					Unfortunately, player statistics are not available from FF Logs. As such, the calculated GCD length is an <em>estimate</em>, and may well be incorrect. If it is reporting a GCD length <em>longer</em> than reality, you likely need to focus on keeping your GCD rolling.
				</Trans>
			),
		}))
	}
}
