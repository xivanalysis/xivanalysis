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

	private totalForks: number = 0
	private totalFleets: number = 0
	private currentStacks: number = 0
	private droppedStacks: number = 0

	private breakingGcds = [
		this.data.actions.SPINNING_EDGE.id,
		this.data.actions.GUST_SLASH.id,
		this.data.actions.AEOLIAN_EDGE.id,
		this.data.actions.ARMOR_CRUSH.id,
		this.data.actions.DEATH_BLOSSOM.id,
		this.data.actions.HAKKE_MUJINSATSU.id,
		this.data.actions.HURAIJIN.id,
	]

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.FORKED_RAIJU.id), () => this.totalForks++)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.FLEETING_RAIJU.id), () => this.totalFleets++)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.FORKED_RAIJU_READY.id), this.onForkedRaijuReady)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.FORKED_RAIJU_READY.id), () => this.currentStacks = 0)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.breakingGcds)), this.onBreakingGcd)
		this.addEventHook('complete', this.onComplete)
	}

	private onForkedRaijuReady(event: Events['statusApply']) {
		this.currentStacks = event.data ?? 1
	}

	private onBreakingGcd() {
		this.droppedStacks += this.currentStacks
		this.currentStacks = 0
	}

	private onComplete() {
		const droppedFleets = (this.totalForks - this.totalFleets) - (this.actors.current.hasStatus(this.data.statuses.FLEETING_RAIJU_READY.id) ? 1 : 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FORKED_RAIJU.icon,
			content: <Trans id="nin.raiju.suggestions.forked.content">
				Avoid using any of your melee GCDs while you have stacks of <StatusLink status="FORKED_RAIJU_READY"/>, as it will cause the stacks to fall off.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM, // TODO - Run these numbers past a theorycrafter
				3: SEVERITY.MAJOR,
			},
			value: this.droppedStacks,
			why: <Trans id="nin.raiju.suggestions.forked.why">
				You dropped <Plural value={this.droppedStacks} one="# stack" other="# stacks"/> of Forked Raiju Ready.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FLEETING_RAIJU.icon,
			content: <Trans id="nin.raiju.suggestions.fleeting.content">
				Avoid using any of your melee GCDs while <StatusLink status="FLEETING_RAIJU_READY"/> is up, as it will cause the buff to fall off.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM, // TODO - Run these numbers past a theorycrafter
				3: SEVERITY.MAJOR,
			},
			value: droppedFleets,
			why: <Trans id="nin.raiju.suggestions.fleeting.why">
				You dropped <Plural value={droppedFleets} one="# stack" other="# stacks"/> of Fleeting Raiju Ready.
			</Trans>,
		}))
	}
}
