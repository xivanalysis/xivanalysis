import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

//The following generate Stacks
const STACK_MAKERS: ActionKey [] = [
	'GLUTTONY',
	'BLOOD_STALK',
	'GRIM_SWATHE',
	'UNVEILED_GALLOWS',
	'UNVEILED_GIBBET',
]

// The following all drop EVERY stack of soul reaver when successfully cast
const STACK_DROPPERS: ActionKey [] = [
	'SLICE',
	'WAXING_SLICE',
	'INFERNAL_SLICE',
	'SHADOW_OF_DEATH',
	'WHORL_OF_DEATH',
	'SOUL_SLICE',
	'SOUL_SCYTHE',
	'SOULSOW',
	'HARVEST_MOON',
	'HARPE',
	'NIGHTMARE_SCYTHE',
	'SPINNING_SCYTHE',
	'PLENTIFUL_HARVEST',
]

//The following are what you are suppose to use the stacks on.
const STACK_SKILLS_TO_USE: ActionKey [] = [
	'GALLOWS',
	'GIBBET',
	'GUILLOTINE',
]

const SOUL_GAIN = 1 //Soul consuming moves grant 1 reaver except for...
const GLUTTONY_GAIN = 2 //Gluttony grants 2 reavers, also therotically max

export class Reaver extends Analyser {
	static override handle = 'reaver'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

	//Trackers
	private droppedReavers = 0
	private currentReaverStacks = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(this.data.matchActionId(STACK_MAKERS)),
			this.onStackGain
		)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(this.data.matchActionId(STACK_DROPPERS)),
			this.dropStacks
		)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(this.data.matchActionId(STACK_SKILLS_TO_USE)),
			this.onStackUse
		)

		//Death means you drop them stacks too, ya know?
		this.addEventHook(filter<Event>().type('death').actor(this.parser.actor.id), this.dropStacks)
		this.addEventHook('complete', this.onComplete)

	}

	private onStackGain(event: Events['action']) : void {
		//If Player has reaver, slap them
		if (this.actors.current.hasStatus(this.data.statuses.SOUL_REAVER.id)) {
			this.dropStacks()
		}
		//Slap stacks on them
		this.currentReaverStacks = (event.action === this.data.actions.GLUTTONY.id) ? GLUTTONY_GAIN : SOUL_GAIN
	}

	private onStackUse() {
		if (this.actors.current.hasStatus(this.data.statuses.SOUL_REAVER.id)) {
			this.currentReaverStacks--
		}
	}

	private dropStacks() {
		this.droppedReavers += this.currentReaverStacks
		this.currentReaverStacks = 0
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GLUTTONY.icon,
			content: <Trans id = "rpr.reaver.suggestion.dropped.content">
				Avoid dropping <DataLink status="SOUL_REAVER"/> by using <DataLink action="GALLOWS"/>, <DataLink action="GIBBET"/>, or <DataLink action="GUILLOTINE"/>. These actions have high damage and grant you 10 Shroud gauge, giving you more chances to use <DataLink action="ENSHROUD"/> over the course of a fight.
			</Trans>,
			tiers: SEVERITY_TIERS,
			why: <Trans id ="rpr.reaver.suggestion.dropped.why">
					You used lost <Plural value={this.droppedReavers} one="# stack" other="# stacks"/> over the course of the fight.
			</Trans>,
			value: this.droppedReavers,
		}))
	}
}
