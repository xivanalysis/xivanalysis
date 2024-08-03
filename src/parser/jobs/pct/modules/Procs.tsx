import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {ProcGroup, Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DEFAULT_SEVERITY_TIERS} from 'parser/jobs/dnc/CommonData'
import React from 'react'

// Rainbow Bright makes Rainbow Drip instant, and lowers the 6s recast to a normal 2.5s GCD
const RAINBOW_BRIGHT_RECAST_ADJUSTMENT = -3500

export default class Procs extends CoreProcs {
	@dependency castTime!: CastTime

	override trackedProcs = [
		{
			procStatus: this.data.statuses.AETHERHUES,
			consumeActions: [
				this.data.actions.AERO_IN_GREEN,
				this.data.actions.AERO_II_IN_GREEN,
				this.data.actions.STONE_IN_YELLOW,
				this.data.actions.STONE_II_IN_YELLOW,
			],
		},
		{
			procStatus: this.data.statuses.AETHERHUES_II,
			consumeActions: [
				this.data.actions.WATER_IN_BLUE,
				this.data.actions.WATER_II_IN_BLUE,
				this.data.actions.THUNDER_IN_MAGENTA,
				this.data.actions.THUNDER_II_IN_MAGENTA,
			],
		},
		{
			procStatus: this.data.statuses.RAINBOW_BRIGHT,
			consumeActions: [
				this.data.actions.RAINBOW_DRIP,
			],
		},
		{
			procStatus: this.data.statuses.STARSTRUCK,
			consumeActions: [
				this.data.actions.STAR_PRISM,
			],
		},
	]
	override showProcIssueOutput = true

	protected override jobSpecificOnConsumeProc(procGroup: ProcGroup, event: Events['action']): void {
		// Rainbow bright changes Rainbow Drip from a 4s cast/6s recast to a standard instant GCD
		if (procGroup.procStatus.id === this.data.statuses.RAINBOW_BRIGHT.id) {
			this.castTime.setInstantCastAdjustment([this.data.actions.RAINBOW_DRIP.id], event.timestamp, event.timestamp)
			this.castTime.setRecastTimeAdjustment([this.data.actions.RAINBOW_DRIP.id], RAINBOW_BRIGHT_RECAST_ADJUSTMENT)
		}
	}

	protected override addJobSpecificSuggestions(): void {
		const droppedAetherhues = this.getDropCountForStatus(this.data.statuses.AETHERHUES.id) + this.getDropCountForStatus(this.data.statuses.AETHERHUES_II.id)
		const droppedRainbows = this.getDropCountForStatus(this.data.statuses.RAINBOW_BRIGHT.id)
		const droppedStars = this.getDropCountForStatus(this.data.statuses.STARSTRUCK.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.statuses.AETHERHUES_II.icon,
			content: <Trans id="pct.procs.dropped-aetherhues.content">Your <DataLink status="AETHERHUES" /> and <DataLink status="AETHERHUES_II" /> statuses function as Pictomancer's combos, and dropping them will slow the rate at which you're able to use <DataLink action="SUBTRACTIVE_PALETTE" />, leading to lost potency over time.</Trans>,
			why: <Trans id="pct.procs.dropped-aetherhues.why">One of your <DataLink showIcon={false} status="AETHERHUES" /> statuses were allowed to expire <Plural value={droppedAetherhues} one="# time" other="# times"/>.</Trans>,
			value: droppedAetherhues,
			tiers: DEFAULT_SEVERITY_TIERS,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.statuses.RAINBOW_BRIGHT.icon,
			content: <Trans id="pct.procs.dropped-rainbows.content"><DataLink action="RAINBOW_DRIP" /> is one of your strongest GCDs, and <DataLink status="RAINBOW_BRIGHT" /> allows its use as a normal-length instant GCD, rather than requiring an extremely long cast time.</Trans>,
			why: <Trans id="pct.procs.dropped-rainbows.why"><DataLink showIcon={false} status="RAINBOW_BRIGHT" /> was allowed to expire <Plural value={droppedRainbows} one="# time" other="# times" />.</Trans>,
			value: droppedRainbows,
			tiers:  {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.statuses.STARSTRUCK.icon,
			content: <Trans id="pct.procs.dropped-stars.content"><DataLink action="STAR_PRISM" /> is your strongest GCD, and includes a party-wide heal as well. Make sure to use it before <DataLink status="STARSTRUCK" /> wears off.</Trans>,
			why: <Trans id="pct.procs.dropped-stars.why"><DataLink showIcon={false} status="STARSTRUCK" /> was allowed to expire <Plural value={droppedStars} one="# time" other="# times" />.</Trans>,
			value: droppedStars,
			tiers:  {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))
	}
}
