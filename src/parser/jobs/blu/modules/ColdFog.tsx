import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Tiered suggestion severities
const COLD_SEVERITY = {
	DROPPED_COLD_FOG: {
		1: SEVERITY.MAJOR,
	},
	DROPPED_WHITE_DEATH_CASTS: {
		1: SEVERITY.MEDIUM,
	},
	INEFFECTIVE_COLD_FOG: {
		1: SEVERITY.MAJOR,
	},
}

const COLD_FOG_MINIMUM_VIABLE_CASTS = 2
const COLD_COLD_IDEAL_CASTS = 6

interface ColdFogWindow {
	whiteDeathCasts: number
}

export class ColdFog extends Analyser {
	static override handle = 'coldfog'
	static override title = t('blu.cold_fog.title')`Cold Fog`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private coldFogCasts = 0
	private touchOfFrostHistory = new History<ColdFogWindow>(
		() => ({
			whiteDeathCasts: 0,
		})
	)

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.TOUCH_OF_FROST.id), this.onApplyTouchOfFrost)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.TOUCH_OF_FROST.id), this.onRemoveTouchOfFrost)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.COLD_FOG.id), this.onApplyColdFog)

		// Start tracking to see if they got the six White Death GCDs during the window
		this.addEventHook(playerFilter.action(this.data.actions.WHITE_DEATH.id).type('action'), this.onWhiteDeath)

		this.addEventHook('complete', this.onComplete)
	}

	private onApplyTouchOfFrost(event: Events['statusApply']) {
		this.touchOfFrostHistory.openNew(event.timestamp)
	}
	private onRemoveTouchOfFrost(event: Events['statusRemove']) {
		this.touchOfFrostHistory.closeCurrent(event.timestamp)
	}

	private onWhiteDeath(event: Events['action']) {
		const current = this.touchOfFrostHistory.getCurrent()
		if (current == null) { return }

		if (event.action === this.data.actions.WHITE_DEATH.id) {
			current.data.whiteDeathCasts++
		}
	}

	private onApplyColdFog() {
		this.coldFogCasts++
	}

	private onComplete() {

		this.touchOfFrostHistory.closeCurrent(this.parser.pull.timestamp + this.parser.pull.duration)

		// Wiffled Cold Fog
		const droppedColdFogs = this.coldFogCasts - this.touchOfFrostHistory.entries.length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.COLD_FOG.icon,
			content: <Trans id="blu.coldfog.dropped.content">
				Any damage taken while the <DataLink status="COLD_FOG"/> effect is active grants the <DataLink status="TOUCH_OF_FROST"/>
				buff, allowing the use of <DataLink action="WHITE_DEATH" /> for 15 seconds.<br />
				You should ensure you can proc every cast of <DataLink action="COLD_FOG" showIcon={false} />.
			</Trans>,
			tiers: COLD_SEVERITY.DROPPED_COLD_FOG,
			value: droppedColdFogs,
			why: <Trans id="blu.coldfog.dropped.why">
				<Plural value={droppedColdFogs} one="# Cold Fog use" other="# Cold Fog uses" /> did not proc <DataLink action="WHITE_DEATH"  showIcon={false} showTooltip={false} />
			</Trans>,
		}))

		// Every Touch of Frost window should have at least two casts of White Death (to offset the opportunity cost of
		// casting Cold Fog), and ideally 6 or 7 casts total of White Death, depending on spell speed.
		const ineffectiveColdFog = this.touchOfFrostHistory.entries
			.filter(entry => entry.data.whiteDeathCasts < COLD_FOG_MINIMUM_VIABLE_CASTS)
			.length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.COLD_FOG.icon,
			content: <Trans id="blu.coldfog.ineffective.content">
				For <DataLink action="COLD_FOG"/> to be effective, you need to cast <DataLink action="WHITE_DEATH" />
				at least two times while under <DataLink status="TOUCH_OF_FROST" />.
			</Trans>,
			tiers: COLD_SEVERITY.INEFFECTIVE_COLD_FOG,
			value: ineffectiveColdFog,
			why: <Trans id="blu.coldfog.ineffective.why">
				<Plural value={ineffectiveColdFog} one="# Cold Fog use" other="# Cold Fog uses" /> were a DPS loss due to not using <DataLink action="WHITE_DEATH"  showIcon={false} showTooltip={false} /> enough times
			</Trans>,
		}))

		// Doing less than 6 cold fogs is rarely good, although some fight timelines necessitate it.
		const droppedWhiteDeathCasts = this.touchOfFrostHistory.entries
			.filter(entry => entry.data.whiteDeathCasts >= COLD_FOG_MINIMUM_VIABLE_CASTS)
			.filter(entry => entry.data.whiteDeathCasts  < COLD_COLD_IDEAL_CASTS)
			.length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.COLD_FOG.icon,
			content: <Trans id="blu.coldfog.dropped_casts.content">
				<DataLink action="WHITE_DEATH" /> should be cast 6 or 7 times (depending on spell speed)
				for each <DataLink action="COLD_FOG" /> cast.
			</Trans>,
			tiers: COLD_SEVERITY.DROPPED_WHITE_DEATH_CASTS,
			value: droppedWhiteDeathCasts,
			why: <Trans id="blu.coldfog.dropped_casts.why">
				<Plural value={droppedWhiteDeathCasts} one="# Cold Fog use" other="# Cold Fog uses" /> cast <DataLink action="WHITE_DEATH"  showIcon={false} showTooltip={false} /> less than 6 times.
			</Trans>,
		}))
	}
}
