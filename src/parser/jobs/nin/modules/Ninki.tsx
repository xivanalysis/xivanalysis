import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {CastEvent} from 'fflogs'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import {ComboEvent} from 'parser/core/modules/Combos'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

// Constants
const MAX_NINKI = 100

const ACTION_NINKI_GAIN = {
	[ACTIONS.SPINNING_EDGE.id]: 5,
	[ACTIONS.GUST_SLASH.id]: 5,
	[ACTIONS.DEATH_BLOSSOM.id]: 5,
	[ACTIONS.HAKKE_MUJINSATSU.id]: 5,
	[ACTIONS.THROWING_DAGGER.id]: 5,
	[ACTIONS.AEOLIAN_EDGE.id]: 10,
	[ACTIONS.ARMOR_CRUSH.id]: 10,
	[ACTIONS.SHADOW_FANG.id]: 10,
	[ACTIONS.MUG.id]: 40,
	[ACTIONS.MEISUI.id]: 50,
}
const BUNSHIN_NINKI_GAIN = 5
const SPENDER_COST = 50

const NINKI_GCDS = [
	ACTIONS.SPINNING_EDGE.id,
	ACTIONS.DEATH_BLOSSOM.id,
	ACTIONS.THROWING_DAGGER.id,
	ACTIONS.SHADOW_FANG.id,
]

const NINKI_COMBOS = [
	ACTIONS.GUST_SLASH.id,
	ACTIONS.AEOLIAN_EDGE.id,
	ACTIONS.ARMOR_CRUSH.id,
	ACTIONS.HAKKE_MUJINSATSU.id,
]

const NINKI_OGCDS = [
	ACTIONS.MUG.id,
	ACTIONS.MEISUI.id,
]

const NINKI_SPENDERS = [
	ACTIONS.HELLFROG_MEDIUM.id,
	ACTIONS.BHAVACAKRA.id,
	ACTIONS.BUNSHIN.id,
]

interface DataPoint {
	t: number,
	y: number,
}

export default class Ninki extends Module {
	static override handle = 'ninki'
	static override title = t('nin.ninki.title')`Ninki Timeline`
	static override displayMode = DISPLAY_MODE.FULL

	@dependency private suggestions!: Suggestions

	private ninki: number = 0
	private ninkiHistory: DataPoint[] = []
	private wasteBySource: {[key: number]: number} = {
		[ACTIONS.MUG.id]: 0,
		[ACTIONS.MEISUI.id]: 0,
		[ACTIONS.SPINNING_EDGE.id]: 0,
		[ACTIONS.GUST_SLASH.id]: 0,
		[ACTIONS.AEOLIAN_EDGE.id]: 0,
		[ACTIONS.SHADOW_FANG.id]: 0,
		[ACTIONS.ARMOR_CRUSH.id]: 0,
		[ACTIONS.DEATH_BLOSSOM.id]: 0,
		[ACTIONS.HAKKE_MUJINSATSU.id]: 0,
		[ACTIONS.THROWING_DAGGER.id]: 0,
	}
	private erroneousFrogs: number = 0 // This is my new band name

	protected override init() {
		this.addEventHook('cast', {by: 'player', abilityId: NINKI_GCDS}, this.onBuilderCast)
		this.addEventHook('combo', {by: 'player', abilityId: NINKI_COMBOS}, this.onBuilderCast)
		this.addEventHook('cast', {by: 'player', abilityId: NINKI_OGCDS}, this.onBuilderCast)
		this.addEventHook('cast', {by: 'pet'}, this.onBunshinHit)
		this.addEventHook('cast', {by: 'player', abilityId: NINKI_SPENDERS}, this.onSpenderCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: ACTIONS.HELLFROG_MEDIUM.id}, this.onHellfrogAoe)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)

	}

	private onBuilderCast(event: CastEvent | ComboEvent) {
		const abilityId = event.ability.guid
		this.addNinki(ACTION_NINKI_GAIN[abilityId], abilityId)
	}

	private onBunshinHit() {
		this.addNinki(BUNSHIN_NINKI_GAIN)
	}

	private addNinki(amount: number, abilityId?: number) {
		this.ninki += amount
		if (this.ninki > MAX_NINKI && abilityId) {
			const waste = this.ninki - MAX_NINKI
			this.wasteBySource[abilityId] += waste
			this.ninki = MAX_NINKI
		}

		this.pushToHistory()
	}

	private onSpenderCast() {
		this.ninki = Math.max(this.ninki - SPENDER_COST, 0)
		this.pushToHistory()
	}

	private onHellfrogAoe(event: NormalisedDamageEvent) {
		if (event.hitCount === 1) {
			// If we have a Hellfrog AoE event with only one target, it should've been a Bhava instead
			this.erroneousFrogs++
		}
	}

	private onDeath() {
		// YOU DONE FUCKED UP NOW
		this.ninki = 0
		this.pushToHistory()
	}

	private pushToHistory() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this.ninkiHistory.push({t: timestamp, y: this.ninki})
	}

	private onComplete() {
		const totalWaste = Object.values(this.wasteBySource).reduce((reducer, value) => reducer + value)
		this.suggestions.add(new TieredSuggestion({
			icon: 'https://xivapi.com/i/005000/005411.png',
			content: <Trans id="nin.ninki.suggestions.waste.content">
				Avoid using <ActionLink {...ACTIONS.MUG}/> and <ActionLink {...ACTIONS.MEISUI}/> when above 40 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
			</Trans>,
			tiers: {
				20: SEVERITY.MINOR,
				50: SEVERITY.MAJOR,
			},
			value: totalWaste,
			why: <Trans id="nin.ninki.suggestions.waste.why">
				Overcapping caused you to lose {totalWaste} Ninki over the fight.
			</Trans>,
		}))

		if (this.erroneousFrogs > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HELLFROG_MEDIUM.icon,
				content: <Trans id="nin.ninki.suggestions.frog.content">
					Avoid using <ActionLink {...ACTIONS.HELLFROG_MEDIUM}/> when you only have one target, as <ActionLink {...ACTIONS.BHAVACAKRA}/> has higher potency and can be used freely.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.ninki.suggestions.frog.why">
					You used Hellfrog Medium <Plural value={this.erroneousFrogs} one="# time" other="# times"/> when other spenders were available.
				</Trans>,
			}))
		}
	}

	override output() {
		const ninkiColor = Color(JOBS.NINJA.colour)

		/* eslint-disable @typescript-eslint/no-magic-numbers */
		const chartdata = {
			datasets: [
				{
					label: 'Ninki',
					steppedLine: true,
					data: this.ninkiHistory,
					backgroundColor: ninkiColor.fade(0.8).toString(),
					borderColor: ninkiColor.fade(0.5).toString(),
				},
			],
		}
		/* eslint-enable @typescript-eslint/no-magic-numbers */

		return <Fragment>
			<TimeLineChart data={chartdata} />
		</Fragment>
	}
}
