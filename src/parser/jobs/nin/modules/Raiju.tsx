import {Trans, Plural} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class Raiju extends Analyser {
	static override handle = 'raiju'

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private currentStacks: number = 0
	private droppedStacks: number = 0

	private breakingGcds = [
		this.data.actions.SPINNING_EDGE.id,
		this.data.actions.GUST_SLASH.id,
		this.data.actions.AEOLIAN_EDGE.id,
		this.data.actions.ARMOR_CRUSH.id,
		this.data.actions.DEATH_BLOSSOM.id,
		this.data.actions.HAKKE_MUJINSATSU.id,
	]

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.RAIJU_READY.id), this.onRaijuReady)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.RAIJU_READY.id), () => this.currentStacks = 0)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.breakingGcds)), this.onBreakingGcd)
		this.addEventHook('complete', this.onComplete)
	}

	private onRaijuReady(event: Events['statusApply']) {
		this.currentStacks = event.data ?? 1
	}

	private onBreakingGcd() {
		this.droppedStacks += this.currentStacks
		this.currentStacks = 0
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FLEETING_RAIJU.icon,
			content: <Trans id="nin.raiju.suggestions.dropped.content">
				Avoid using any of your non-Raiju melee GCDs while you have stacks of <StatusLink status="RAIJU_READY"/>, as it will cause the stacks to fall off.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: this.droppedStacks,
			why: <Trans id="nin.raiju.suggestions.dropped.why">
				You dropped <Plural value={this.droppedStacks} one="# stack" other="# stacks"/> of Raiju Ready.
			</Trans>,
		}))
	}
}
