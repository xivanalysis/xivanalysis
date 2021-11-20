import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {BASE_GCD} from 'data/CONSTANTS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SEVERITY_EXPIRED_DUALCAST = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const SEVERITY_WASTED_DUALCAST = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export class DualCast extends Analyser {
	static override handle = 'dualCast'
	static override title = t('rdm.dualcast.title')`Dualcast`
	static override displayOrder = DISPLAY_ORDER.DUALCAST

	@dependency private castTime!: CastTime
	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions

	private wastedDualCasts: Array<Events['action']> = []
	private expiredDualCasts = 0
	private dualcastActive = false
	private dualcastIndex: number | null = null

	override initialise() {
		const playerEvents = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerEvents.type('action'), this.onCast)
		this.addEventHook(playerEvents
			.status(this.data.statuses.DUALCAST.id)
			.type('statusApply'), this.onGain)
		this.addEventHook(playerEvents
			.status(this.data.statuses.DUALCAST.id)
			.type('statusRemove'), this.onRemove)
		this.addEventHook(filter<Event>().type('complete'), this.onComplete)
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)
		const castTime = action?.castTime ?? 0

		if (this.dualcastActive && castTime > 0) {
			if (!this.downtime.isDowntime() && (castTime <= BASE_GCD || action === this.data.actions.SPRINT)) {
				this.wastedDualCasts.push(event)
			}
			this.dualcastActive = false
		}
	}

	private onGain() {
		this.dualcastActive = true
		this.dualcastIndex = this.castTime.setInstantCastAdjustment()
	}

	private onRemove() {
		if (this.dualcastActive) {
			if (!this.downtime.isDowntime()) {
				this.expiredDualCasts++
			}
		}
		this.dualcastActive = false
		this.castTime.reset(this.dualcastIndex)
	}

	private onComplete() {
		if (this.wastedDualCasts.length > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.statuses.DUALCAST.icon,
				content: <Trans id="rdm.dualcast.suggestions.wasted.content">
					Spells used while <StatusLink {...this.data.statuses.DUALCAST}/> is up should be limited to <ActionLink {...this.data.actions.VERAERO}/>, <ActionLink {...this.data.actions.VERTHUNDER}/>, or <ActionLink {...this.data.actions.VERRAISE}/>
				</Trans>,
				tiers: SEVERITY_WASTED_DUALCAST,
				value: this.wastedDualCasts.length,
				why: <Trans id="rdm.dualcast.suggestions.wasted.why">{this.wastedDualCasts.length} <Plural value={this.wastedDualCasts.length} one="Dualcast was" other="Dualcasts were" /> wasted on low cast-time spells.</Trans>,
			}))
		}

		if (this.expiredDualCasts > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.statuses.DUALCAST.icon,
				content: <Trans id="rdm.dualcast.suggestions.missed.content">
					You should avoid wasting Dualcast procs entirely as it is lost potency overtime.
				</Trans>,
				tiers: SEVERITY_EXPIRED_DUALCAST,
				value: this.expiredDualCasts,
				why: <Trans id="rdm.dualcast.suggestions.missed.why">{this.expiredDualCasts} <Plural value={this.expiredDualCasts} one="Dualcast was" other="Dualcasts were" /> lost due to not casting.</Trans>,
			}))
		}
	}

	override output() {
		if (this.wastedDualCasts.length === 0) {
			return false
		}

		const panels = this.wastedDualCasts.map(cast => {
			const action = this.data.getAction(cast.action)
			return {
				key: cast.timestamp,
				title: {
					content: <Fragment>
						{this.parser.formatEpochTimestamp(cast.timestamp)}&nbsp;-&nbsp;{action?.name}
					</Fragment>,
				},
				content: {
					content: <Rotation events={[cast]}/>,
				},
			}
		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
