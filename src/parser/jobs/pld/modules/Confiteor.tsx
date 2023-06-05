import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Confiteor extends Analyser {
	static override handle = 'confiteor'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private droppedConfiteors: number = 0
	private usedConfiteor: boolean = false

	private confiteorHook?: EventHook<Events['action']>

	override initialise() {
		this.addEventHook({
			type: 'statusApply',
			source: this.parser.actor.id,
			status: this.data.statuses.CONFITEOR_READY.id,
		}, this.onGain)

		this.addEventHook({
			type: 'statusRemove',
			source: this.parser.actor.id,
			status: this.data.statuses.CONFITEOR_READY.id,
		}, this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	private onGain() {
		this.confiteorHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.CONFITEOR.id),
			() => this.usedConfiteor = true,
		)
	}

	private onDrop() {
		if (!this.usedConfiteor) { this.droppedConfiteors++ }
		if (this.confiteorHook != null) {
			this.removeEventHook(this.confiteorHook)
			this.confiteorHook = undefined
		}
		this.usedConfiteor = false
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.CONFITEOR.icon,
			content: <Trans id="pld.timeouts.confiteor.content">
				Try to consume <DataLink status="CONFITEOR_READY"/> before it expires as the <DataLink action="CONFITEOR"/> combo is your strongest combo.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.droppedConfiteors,
			why: <Trans id="pld.timeouts.confiteor.why">
				<DataLink status="CONFITEOR_READY"/> timed out <Plural value={this.droppedConfiteors} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
