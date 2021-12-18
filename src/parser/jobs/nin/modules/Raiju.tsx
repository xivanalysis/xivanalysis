import {Trans, Plural} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
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
	private totalStacks: number = 0

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.FORKED_RAIJU.id), () => this.totalForks++)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.FLEETING_RAIJU.id), () => this.totalFleets++)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.FORKED_RAIJU_READY.id), () => this.totalStacks++)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		const droppedForks = (this.totalStacks - this.totalForks) - (this.actors.current.getStatusData(this.data.statuses.FORKED_RAIJU_READY.id) ?? 0)
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
			value: droppedForks,
			why: <Trans id="nin.raiju.suggestions.forked.why">
				You dropped <Plural value={droppedForks} one="# stack" other="# stacks"/> of Forked Raiju Ready.
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
