import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {CastEvent} from 'fflogs'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import {LegacyComboEvent} from 'parser/core/modules/Combos'
import {Data} from 'parser/core/modules/Data'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

// Constants
const MAX_NINKI = 100

const GCD_NINKI_GAIN = 5
const FINISHER_NINKI_GAIN = 10
const MUG_NINKI_GAIN = 40
const MEISUI_NINKI_GAIN = 50
const BUNSHIN_NINKI_GAIN = 5
const SPENDER_COST = 50

const ACTION_NINKI_GAIN: Array<[ActionKey, number]> = [
	['SPINNING_EDGE', GCD_NINKI_GAIN],
	['GUST_SLASH', GCD_NINKI_GAIN],
	['DEATH_BLOSSOM', GCD_NINKI_GAIN],
	['HAKKE_MUJINSATSU', GCD_NINKI_GAIN],
	['THROWING_DAGGER', GCD_NINKI_GAIN],
	['AEOLIAN_EDGE', FINISHER_NINKI_GAIN],
	['ARMOR_CRUSH', FINISHER_NINKI_GAIN],
	['SHADOW_FANG', FINISHER_NINKI_GAIN],
	['MUG', MUG_NINKI_GAIN],
	['MEISUI', MEISUI_NINKI_GAIN],
]

const NINKI_GCDS: ActionKey[] = [
	'SPINNING_EDGE',
	'DEATH_BLOSSOM',
	'THROWING_DAGGER',
	'SHADOW_FANG',
]

const NINKI_COMBOS: ActionKey[] = [
	'GUST_SLASH',
	'AEOLIAN_EDGE',
	'ARMOR_CRUSH',
	'HAKKE_MUJINSATSU',
]

const NINKI_OGCDS: ActionKey[] = [
	'MUG',
	'MEISUI',
]

const NINKI_SPENDERS: ActionKey[] = [
	'HELLFROG_MEDIUM',
	'BHAVACAKRA',
	'BUNSHIN',
]

interface DataPoint {
	t: number,
	y: number,
}

export class Ninki extends Module {
	static override handle = 'ninki'
	static override title = t('nin.ninki.title')`Ninki Timeline`
	static override displayMode = DISPLAY_MODE.FULL

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private actionNinkiGain = new Map(ACTION_NINKI_GAIN.map(
		pair => [this.data.actions[pair[0]].id, pair[1]]
	))

	private ninkiGcds: number[] = NINKI_GCDS.map(key => this.data.actions[key].id)

	private ninki: number = 0
	private ninkiHistory: DataPoint[] = []
	private wasteBySource: {[key: number]: number} = {
		[this.data.actions.MUG.id]: 0,
		[this.data.actions.MEISUI.id]: 0,
		[this.data.actions.SPINNING_EDGE.id]: 0,
		[this.data.actions.GUST_SLASH.id]: 0,
		[this.data.actions.AEOLIAN_EDGE.id]: 0,
		[this.data.actions.SHADOW_FANG.id]: 0,
		[this.data.actions.ARMOR_CRUSH.id]: 0,
		[this.data.actions.DEATH_BLOSSOM.id]: 0,
		[this.data.actions.HAKKE_MUJINSATSU.id]: 0,
		[this.data.actions.THROWING_DAGGER.id]: 0,
	}
	private erroneousFrogs: number = 0 // This is my new band name

	protected override init() {
		this.addEventHook('cast', {by: 'player', abilityId: this.ninkiGcds}, this.onBuilderCast)
		this.addEventHook('combo', {by: 'player', abilityId: NINKI_COMBOS.map(key => this.data.actions[key].id)}, this.onBuilderCast)
		this.addEventHook('cast', {by: 'player', abilityId: NINKI_OGCDS.map(key => this.data.actions[key].id)}, this.onBuilderCast)
		this.addEventHook('cast', {by: 'pet'}, this.onBunshinHit)
		this.addEventHook('cast', {by: 'player', abilityId: NINKI_SPENDERS.map(key => this.data.actions[key].id)}, this.onSpenderCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.data.actions.HELLFROG_MEDIUM.id}, this.onHellfrogAoe)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onBuilderCast(event: CastEvent | LegacyComboEvent) {
		const abilityId = event.ability.guid
		// The .get() should never be undefined but we must appease the ts lint gods
		this.addNinki(this.actionNinkiGain.get(abilityId) ?? 0, abilityId)
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
				Avoid using <ActionLink {...this.data.actions.MUG}/> and <ActionLink {...this.data.actions.MEISUI}/> when above 40 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
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
				icon: this.data.actions.HELLFROG_MEDIUM.icon,
				content: <Trans id="nin.ninki.suggestions.frog.content">
					Avoid using <ActionLink {...this.data.actions.HELLFROG_MEDIUM}/> when you only have one target, as <ActionLink {...this.data.actions.BHAVACAKRA}/> has higher potency and can be used freely.
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
