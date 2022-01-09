import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_TIERS = {
	0: SEVERITY.IGNORE,
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export class Kaiten extends Analyser {
	static override handle = 'kaiten'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private kaitenUp = false //Kaiten Flag, duh

	//Trackers
	private doubleKaitens = 0 //apply kaiten while under kaiten to increment this
	private badKaitens = 0 //consume kaiten on gcds deemed bad to increment this
	private missedKaitens = 0 //Miss Good gcds with kaiten to increment this

	//groups
	private TheGoodOnes = [
		this.data.actions.OGI_NAMIKIRI.id,
		this.data.actions.MIDARE_SETSUGEKKA.id,
		this.data.actions.HIGANBANA.id,
		//this.data.actions.TENKA_GOKEN.id (This one is currently not 100% Kaiten)
	]

	private TheBadsOnes = [
		this.data.actions.HAKAZE.id,
		this.data.actions.JINPU.id,
		this.data.actions.ENPI.id,
		this.data.actions.SHIFU.id,
		this.data.actions.FUKO.id,
		this.data.actions.GEKKO.id,
		this.data.actions.MANGETSU.id,
		this.data.actions.KASHA.id,
		this.data.actions.OKA.id,
		this.data.actions.YUKIKAZE.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('statusApply')
				.status(this.data.statuses.KAITEN.id),
			this.onKaiten
		)

		this.addEventHook(
			playerFilter
				.type('statusRemove')
				.status(this.data.statuses.KAITEN.id),
			this.onKaitenRemove
		)

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

		this.addEventHook('complete', this.onComplete)

	}

	private onKaiten() {
		if (this.kaitenUp === true) {
			this.doubleKaitens++
		}
		this.kaitenUp = true
	}

	private onKaitenRemove() {
		this.kaitenUp = false
	}

	private onBadCast() {
		if (this.kaitenUp === true) {
			this.badKaitens++
		}
	}

	private onGoodCast() {
		if (this.kaitenUp === false) {
			this.missedKaitens++
		}
	}

	private onComplete() {
		const test1 = this.missedKaitens
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HISSATSU_KAITEN.icon,
			content: <Trans id = "sam.kaiten.suggestion.badkaiten.content">
				Avoid using <DataLink action="HISSATSU_KAITEN"/> on any GCDs besides <DataLink action ="IAIJUTSU"/> moves and <DataLink action = "OGI_NAMIKIRI"/>. These actions are worth it because of the potency gain per kenki spent.
			</Trans>,
			tiers: SEVERITY_TIERS,
			why: <Trans id ="sam.suggestion.badkaiten.why">
					You used Kaiten  <Plural value={this.badKaitens} one="# time" other="# times"/> on non-optimal GCDs.
			</Trans>,
			value: this.badKaitens,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HISSATSU_KAITEN.icon,
			content: <Trans id = "sam.kaiten.suggestion.missedkaiten.content">
				Always use <DataLink action = "HISSATSU_KAITEN"/> on <DataLink action = "MIDARE_SETSUGEKKA"/>,<DataLink action = "HIGANBANA"/> and <DataLink action="OGI_NAMIKIRI"/>. The gain on these actions from kaiten is too great to miss.
			</Trans>,
			tiers: SEVERITY_TIERS,
			why: <Trans id ="sam.suggestion.missedkaiten.why">
					You forgot to use Kaiten  <Plural value={test1} one="# time" other="# times"/> on optimal GCDs.
			</Trans>,
			value: test1,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HISSATSU_KAITEN.icon,
			content: <Trans id = "sam.kaiten.suggestion.doublekaiten.content">
				Avoid using <DataLink action = "HISSATSU_KAITEN"/> when already under the effect of it.
			</Trans>,
			tiers: SEVERITY_TIERS,
			why: <Trans id ="sam.suggestion.doublekaiten.why">
					You used Kaiten  <Plural value={this.doubleKaitens} one="# time" other="# times"/> when you already had it up.
			</Trans>,
			value: this.doubleKaitens,
		}))
	}
}
