import {Plural, t, Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SLIPSTREAM_TICKS_PER_CAST = 6

const SLIPSTREAM_DURATION = 15000
const SLIPSTREAM_TICK_RATE = 3000

const SLIPSTREAM_SEVERITY = {
	1: SEVERITY.MINOR,
	[SLIPSTREAM_TICKS_PER_CAST]: SEVERITY.MEDIUM,
	[2 * SLIPSTREAM_TICKS_PER_CAST]: SEVERITY.MAJOR,
}

export class Slipstream extends Analyser {
	static override handle = 'slipstream'
	static override title = t('smn.slipstream.title')`Slipstream`

	@dependency data!: Data
	@dependency suggestions!: Suggestions

	private lastSlipstream = 0
	private slipstreamCasts = 0
	private slipstreamTicks = 0

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.action(this.data.statuses.SLIPSTREAM.id)
				.type('action'),
			this.onSlipstreamCast
		)
		this.addEventHook(
			playerFilter
				.cause(this.data.matchCauseStatus(['SLIPSTREAM']))
				.type('damage'),
			this.onSlipstreamTick)

		this.addEventHook('complete', this.onComplete)
	}

	private onSlipstreamCast(event: Events['action']) {
		this.lastSlipstream = event.timestamp
		this.slipstreamCasts += 1
	}

	private onSlipstreamTick() {
		this.slipstreamTicks += 1
	}

	private onComplete() {
		let missedTicks = Math.max(0, this.slipstreamCasts * SLIPSTREAM_TICKS_PER_CAST - this.slipstreamTicks)
		// do not penalise for end of fight ticks
		const pullEndTime = (this.parser.pull.timestamp + this.parser.pull.duration)
		if ((this.lastSlipstream + SLIPSTREAM_DURATION) > pullEndTime) {
			const lastPossibleTicks = Math.floor((pullEndTime - this.lastSlipstream) / SLIPSTREAM_TICK_RATE)
			const forgivenTicks = SLIPSTREAM_TICKS_PER_CAST - lastPossibleTicks
			missedTicks = Math.max(0, missedTicks - forgivenTicks)
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SLIPSTREAM.icon,
			tiers: SLIPSTREAM_SEVERITY,
			value: missedTicks,
			content: <Trans id="smn.pets.suggestions.slipstream-ticks.content">
				Ensure you use <ActionLink action="SLIPSTREAM" /> such that it can deal damage for its entire duration.
			</Trans>,
			why: <Trans id="smn.pets.suggestions.slipstream-ticks.why">
				<Plural value={missedTicks} one="# missed tick" other="# missed ticks" /> of Slipstream.
			</Trans>,
		}))
	}
}
