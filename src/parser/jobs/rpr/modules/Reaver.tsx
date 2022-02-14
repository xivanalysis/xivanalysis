import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

export class Reaver extends Analyser {
	static override handle = 'reaver'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	//Trackers
	private haveReaver = false

	private droppedReaver = 0
	private currentReaverStacks = 0

	//groups
	private TheMakers = [
		this.data.actions.BLOOD_STALK.id,
		this.data.actions.GRIM_SWATHE.id,
		this.data.actions.UNVEILED_GALLOWS.id,
		this.data.actions.UNVEILED_GIBBET.id,
		this.data.actions.GLUTTONY.id,
	]

	private TheGoodOnes = [
		this.data.actions.GUILLOTINE.id,
		this.data.actions.GIBBET.id,
		this.data.actions.GALLOWS.id,
	]

	private TheBadsOnes = [ //Generators handle elsewhere
		this.data.actions.SLICE.id,
		this.data.actions.WAXING_SLICE.id,
		this.data.actions.INFERNAL_SLICE.id,
		this.data.actions.HARVEST_MOON.id,
		this.data.actions.SOULSOW.id, //Yes, even this takes it.
		this.data.actions.HARPE.id,
		this.data.actions.SHADOW_OF_DEATH.id,
		this.data.actions.WHORL_OF_DEATH.id,
		this.data.actions.SOUL_SCYTHE.id,
		this.data.actions.SOUL_SLICE.id,
		this.data.actions.SPINNING_SCYTHE.id,
		this.data.actions.NIGHTMARE_SCYTHE.id,
		this.data.actions.PLENTIFUL_HARVEST.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(oneOf(this.TheBadsOnes)),
			this.onBadCast
		)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(oneOf(this.TheGoodOnes)),
			this.onGoodCast
		)

		this.addEventHook(
			playerFilter
				.type('action')
				.action(oneOf(this.TheMakers)),
			this.onGenCast
		)

		this.addEventHook('complete', this.onComplete)

	}

	private onGenCast(event: Events['action']) : void {
		if (this.haveReaver === true) {
			this.droppedReaver += this.currentReaverStacks
			this.currentReaverStacks = 0
			this.haveReaver = false
		}
		if (event.action === this.data.actions.GLUTTONY.id)	{
			this.currentReaverStacks++
			this.haveReaver = true
		}
		this.currentReaverStacks++
		this.haveReaver = true
	}

	private onBadCast() {
		if (this.haveReaver === true) {
			this.droppedReaver += this.currentReaverStacks
			this.currentReaverStacks = 0
			this.haveReaver = false
		}
	}

	private onGoodCast() {
		this.currentReaverStacks--

		if (this.currentReaverStacks <= 0) { //bug check + flag change
			this.currentReaverStacks = 0
			this.haveReaver = false
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GLUTTONY.icon,
			content: <Trans id = "rpr.reaver.suggestion.droppedreaver.content">
				Avoid dropping <DataLink status="SOUL_REAVER"/> by using <DataLink action="GUILLOTINE"/> , <DataLink action="GALLOWS"/> , and <DataLink action="GIBBET"/>. These actions grant you more damage and 10 shroud gauge, which is important to maximize the amount of <DataLink action="ENSHROUD"/> over the course of a fight.
			</Trans>,
			tiers: SEVERITY_TIERS,
			why: <Trans id ="rpr.suggestion.droppedreaver.why">
					You used lost <Plural value={this.droppedReaver} one="# stack" other="# stacks"/> over the course of the fight.
			</Trans>,
			value: this.droppedReaver,
		}))
	}
}
