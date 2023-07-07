import {Trans, Plural} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import STATUSES, {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

interface buffMisuse {
	dropped: number
	overwrote: number
	duration: number
}

export class DroppedBuffs extends Analyser {
	static override handle = 'droppedbuffs'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private downtime!: Downtime

	private currentBuffs = new Map<Status['id'], number>()
	private misusedBuffs : {[key: number]: buffMisuse} = {
		[STATUSES.BRISTLE.id]: {dropped: 0, overwrote: 0, duration: STATUSES.BRISTLE.duration},
		[STATUSES.WHISTLE.id]: {dropped: 0, overwrote: 0, duration: STATUSES.WHISTLE.duration},
		[STATUSES.TINGLING.id]: {dropped: 0, overwrote: 0, duration: STATUSES.TINGLING.duration},
	}

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const buffFilter = playerFilter.status(oneOf(Object.keys(this.misusedBuffs).map(Number)))
		this.addEventHook(buffFilter.type('statusApply'), this.onGainBuff)
		this.addEventHook(buffFilter.type('statusRemove'), this.onRemoveBuff)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onRemoveBuff(event: Events['statusRemove']) {
		if (this.currentBuffs.has(event.status)) {
			const buffStart = this.currentBuffs.get(event.status) ?? event.timestamp
			const buffEnd = event.timestamp
			const buffDelta = buffEnd - buffStart
			if (buffDelta >= this.misusedBuffs[event.status].duration) {
				// Buff expired!
				this.misusedBuffs[event.status].dropped++
			}
		}
		this.currentBuffs.delete(event.status)
	}

	private onGainBuff(event: Events['statusApply']) {
		const current = this.currentBuffs.get(event.status)
		this.currentBuffs.set(event.status, event.timestamp)

		if (current === undefined) {
			return
		}

		// Overwrite! Let's ignore it if this is during downtime:
		const duringDowntime = this.downtime.getDowntime(event.timestamp - 2, event.timestamp)
		if (duringDowntime >= 0) {
			return
		}

		// Not during downtime, so just an overwrite.
		this.misusedBuffs[event.status].overwrote++
	}

	private onDeath() {
		this.currentBuffs.clear()
	}

	private suggestOnDroppedStatus(statusID: Status['id'], droppedStatusCount: number) {
		const droppedStatus = this.data.getStatus(statusID)
		if (droppedStatus === undefined) { return }
		this.suggestions.add(new TieredSuggestion({
			icon: droppedStatus.icon,
			content: <Trans id="blu.droppedbuffs.suggestions.dropped.content" >
				<StatusLink {...droppedStatus} /> fell off without being used.
			</Trans>,
			tiers: {1: SEVERITY.MEDIUM},
			value: droppedStatusCount,
			why: <Trans id="blu.droppedbuffs.suggestions.dropped.why" >
				<Plural value={droppedStatusCount} one="# Use of " other="# Uses of "/> <StatusLink {...droppedStatus} showIcon={false} /> expired.
			</Trans>,
		}))
	}

	private suggestOnOverwrittenStatus(statusID: Status['id'], overwrittenStatusCount: number) {
		const overwrittenStatus = this.data.getStatus(statusID)
		if (overwrittenStatus === undefined) { return }
		this.suggestions.add(new TieredSuggestion({
			icon: overwrittenStatus.icon,
			content: <Trans id="blu.droppedbuffs.suggestions.overwritten.content" >
				<StatusLink {...overwrittenStatus} /> was overwritten.
			</Trans>,
			tiers: {1: SEVERITY.MEDIUM},
			value: overwrittenStatusCount,
			why: <Trans id="blu.droppedbuffs.suggestions.overwritten.why" >
				<Plural value={overwrittenStatusCount} one="# Use of " other="# Uses of "/> <StatusLink {...overwrittenStatus} showIcon={false} /> were overwritten.
			</Trans>,
		}))
	}

	private onComplete() {
		Object.keys(this.misusedBuffs).map(Number).forEach(statusID => {
			this.suggestOnDroppedStatus(statusID, this.misusedBuffs[statusID].dropped)
			this.suggestOnOverwrittenStatus(statusID, this.misusedBuffs[statusID].overwrote)
		})
	}
}
