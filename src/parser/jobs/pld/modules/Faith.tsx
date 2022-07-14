import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const TRACKED_STATUSES: StatusKey[] = [
	'BLADE_OF_FAITH_READY',
]

export class Faith extends Analyser {
	static override handle = 'faith'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private droppedFaiths: number = 0
	private usedFaith: boolean = false

	private faithHook?: EventHook<Events['action']>

	override initialise() {
		const trackedStatuses = TRACKED_STATUSES.map(key => this.data.statuses[key].id)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(oneOf(trackedStatuses)), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(oneOf(trackedStatuses)), this.onDrop)
		this.addEventHook('complete', this.onComplete)
	}

	private onGain() {
		this.faithHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.BLADE_OF_FAITH.id),
			() => this.usedFaith = true,
		)
	}

	private onDrop() {
		if (!this.usedFaith) { this.droppedFaiths++ }
		if (this.faithHook != null) {
			this.removeEventHook(this.faithHook)
			this.faithHook = undefined
		}
		this.usedFaith = false
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BLADE_OF_FAITH.icon,
			content: <Trans id="pld.timeouts.faith.content">
				Try to consume <DataLink status="BLADE_OF_FAITH_READY"/> before it expires as the <DataLink action="BLADE_OF_VALOR"/> combo is your strongest combo.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.droppedFaiths,
			why: <Trans id="pld.timeouts.faith.why">
				<DataLink status="BLADE_OF_FAITH_READY"/> timed out <Plural value={this.droppedFaiths} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
