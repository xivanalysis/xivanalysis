import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import JOBS from 'data/JOBS'
import {Cause, Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

type GaugeModifier = Partial<Record<Event['type'], number>>

// Constants
const GCD_GAIN = 5
const FINISHER_GAIN = 10
const MUG_GAIN = 40
const MEISUI_GAIN = 50
const BUNSHIN_GAIN = 5
const SPENDER_COST = -50

const OVERCAP_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

export class Ninki extends CoreGauge {
	static override title = t('nin.ninki.title')`Ninki Timeline`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private ninkiGauge = this.add(new CounterGauge({
		chart: {label: 'Ninki', color: JOBS.NINJA.colour},
	}))

	private ninkiModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.SPINNING_EDGE.id, {action: GCD_GAIN}],
		[this.data.actions.GUST_SLASH.id, {combo: GCD_GAIN}],
		[this.data.actions.AEOLIAN_EDGE.id, {combo: FINISHER_GAIN}],
		[this.data.actions.ARMOR_CRUSH.id, {combo: FINISHER_GAIN}],
		[this.data.actions.SHADOW_FANG.id, {action: FINISHER_GAIN}],
		[this.data.actions.DEATH_BLOSSOM.id, {action: GCD_GAIN}],
		[this.data.actions.HAKKE_MUJINSATSU.id, {combo: GCD_GAIN}],
		[this.data.actions.THROWING_DAGGER.id, {action: GCD_GAIN}],
		[this.data.actions.MUG.id, {action: MUG_GAIN}],
		[this.data.actions.MEISUI.id, {action: MEISUI_GAIN}],
		// Spenders
		[this.data.actions.BHAVACAKRA.id, {action: SPENDER_COST}],
		[this.data.actions.HELLFROG_MEDIUM.id, {action: SPENDER_COST}],
		[this.data.actions.BUNSHIN.id, {action: SPENDER_COST}],
	])

	private erroneousFrogs: number = 0 // This is my new band name

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const pets = this.parser.pull.actors.filter(actor => actor.owner === this.parser.actor).map(actor => actor.id)
		this.addEventHook(playerFilter.type(oneOf(['action', 'combo'])).action(oneOf(Array.from(this.ninkiModifiers.keys()))), this.onGaugeModifier)
		this.addEventHook(filter<Event>().source(oneOf(pets)).type('action'), this.onBunshinHit)
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(this.data.actions.HELLFROG_MEDIUM.id)), this.onHellfrog)
		this.addEventHook('complete', this.onComplete)
	}

	private onBunshinHit() {
		this.ninkiGauge.modify(BUNSHIN_GAIN)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.ninkiModifiers.get(event.action)
		if (modifier != null) {
			const amount = modifier[event.type] ?? 0
			this.ninkiGauge.modify(amount)
		}
	}

	private onHellfrog(event: Events['damage']) {
		if (event.targets.length === 1) {
			// If we have a Hellfrog event with only one target, it should've been a Bhava instead
			this.erroneousFrogs++
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: 'https://xivapi.com/i/005000/005411.png',
			content: <Trans id="nin.ninki.suggestions.waste.content">
				Avoid using <ActionLink action="MUG"/> and <ActionLink action="MEISUI"/> when above 40 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: this.ninkiGauge.overCap,
			why: <Trans id="nin.ninki.suggestions.waste.why">
				Overcapping caused you to lose {this.ninkiGauge.overCap} Ninki over the fight.
			</Trans>,
		}))

		if (this.erroneousFrogs > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.HELLFROG_MEDIUM.icon,
				content: <Trans id="nin.ninki.suggestions.frog.content">
					Avoid using <ActionLink action="HELLFROG_MEDIUM"/> when you only have one target, as <ActionLink action="BHAVACAKRA"/> has higher potency and can be used freely.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.ninki.suggestions.frog.why">
					You used Hellfrog Medium <Plural value={this.erroneousFrogs} one="# time" other="# times"/> when other spenders were available.
				</Trans>,
			}))
		}
	}
}
