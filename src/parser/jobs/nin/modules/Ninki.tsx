import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {iconUrl} from 'data/icon'
import {JOBS} from 'data/JOBS'
import {Cause, Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isSuccessfulHit} from 'utilities'

type GaugeModifier = Partial<Record<Event['type'], number>>

// Constants
const BUNSHIN_GAIN = 5
const BUNSHIN_GAIN_KAMAITACHI = 10
const HELLFROG_TARGET_MINIMUM = 3
const DEATHFROG_TARGET_MINIMUM = 2

const OVERCAP_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}
const FROG_SEVERITY = {
	1: SEVERITY.MEDIUM,
}

const ICON_SHUKIHO = 5411

export class Ninki extends CoreGauge {
	static override title = t('nin.ninki.title')`Ninki Gauge`

	@dependency private suggestions!: Suggestions

	private ninkiGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="nin.ninki.resource.label">Ninki</Trans>,
			color: JOBS.NINJA.colour,
		},
	}))

	private ninkiFilters = {
		action: [
			this.data.actions.BHAVACAKRA.id,
			this.data.actions.ZESHO_MEPPO.id,
			this.data.actions.HELLFROG_MEDIUM.id,
			this.data.actions.DEATHFROG_MEDIUM.id,
			this.data.actions.BUNSHIN.id,
			this.data.actions.MEISUI.id,
		],
		combo: [
			this.data.actions.SPINNING_EDGE.id,
			this.data.actions.GUST_SLASH.id,
			this.data.actions.AEOLIAN_EDGE.id,
			this.data.actions.ARMOR_CRUSH.id,
			this.data.actions.DEATH_BLOSSOM.id,
			this.data.actions.HAKKE_MUJINSATSU.id,
		],
		damage: [
			this.data.actions.FORKED_RAIJU.id,
			this.data.actions.FLEETING_RAIJU.id,
			this.data.actions.THROWING_DAGGER.id,
			this.data.actions.MUG.id,
			this.data.actions.DOKUMORI.id,
		],
	}

	private ninkiModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.SPINNING_EDGE.id, {combo: 5}],
		[this.data.actions.GUST_SLASH.id, {combo: 5}],
		[this.data.actions.AEOLIAN_EDGE.id, {combo: 15}],
		[this.data.actions.ARMOR_CRUSH.id, {combo: 15}],
		[this.data.actions.DEATH_BLOSSOM.id, {combo: 5}],
		[this.data.actions.HAKKE_MUJINSATSU.id, {combo: 5}],
		[this.data.actions.FORKED_RAIJU.id, {damage: 5}],
		[this.data.actions.FLEETING_RAIJU.id, {damage: 5}],
		[this.data.actions.THROWING_DAGGER.id, {damage: 5}],
		[this.data.actions.MUG.id, {damage: 40}],
		[this.data.actions.DOKUMORI.id, {damage: 40}],
		[this.data.actions.MEISUI.id, {action: 50}],
		// Spenders
		[this.data.actions.BHAVACAKRA.id, {action: -50}],
		[this.data.actions.ZESHO_MEPPO.id, {action: -50}],
		[this.data.actions.HELLFROG_MEDIUM.id, {action: -50}],
		[this.data.actions.DEATHFROG_MEDIUM.id, {action: -50}],
		[this.data.actions.BUNSHIN.id, {action: -50}],
	])

	// Honestly not sure which of these is the better band name
	private erroneousHellfrogs: number = 0
	private erroneousDeathfrogs: number = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const pets = this.parser.pull.actors.filter(actor => actor.owner === this.parser.actor).map(actor => actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.ninkiFilters.action)), this.onGaugeModifier)
		this.addEventHook(playerFilter.type('combo').action(oneOf(this.ninkiFilters.combo)), this.onGaugeModifier)
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(oneOf(this.ninkiFilters.damage))), this.onDamage)
		this.addEventHook(filter<Event>().source(oneOf(pets)).type('damage'), this.onBunshinHit)
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(this.data.actions.HELLFROG_MEDIUM.id)), this.onHellfrog)
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(this.data.actions.DEATHFROG_MEDIUM.id)), this.onDeathfrog)
		this.addEventHook('complete', this.onComplete)
	}

	private onBunshinHit(event: Events['damage']) {
		if (event.cause.type === 'action' && event.cause.action === this.data.actions.PHANTOM_KAMAITACHI_BUNSHIN.id) {
			this.ninkiGauge.modify(BUNSHIN_GAIN_KAMAITACHI)
		} else {
			this.ninkiGauge.modify(BUNSHIN_GAIN)
		}
	}

	private onDamage(event: Events['damage']) {
		if (!isSuccessfulHit(event) || event.cause.type !== 'action') {
			return
		}

		const modifier = this.ninkiModifiers.get(event.cause.action)
		if (modifier != null) {
			const amount = modifier[event.type] ?? 0
			this.ninkiGauge.modify(amount)
		}
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.ninkiModifiers.get(event.action)
		if (modifier != null) {
			const amount = modifier[event.type] ?? 0
			this.ninkiGauge.modify(amount)
		}
	}

	private onHellfrog(event: Events['damage']) {
		if (event.targets.length < HELLFROG_TARGET_MINIMUM) {
			// If we have a Hellfrog event with fewer than 3 targets, it should've been a Bhava instead
			this.erroneousHellfrogs++
		}
	}

	private onDeathfrog(event: Events['damage']) {
		if (event.targets.length < DEATHFROG_TARGET_MINIMUM) {
			// If we have a Deathfrog event with fewer than 2 targets, it should've been a Zesho Meppo instead
			this.erroneousDeathfrogs++
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: iconUrl(ICON_SHUKIHO),
			content: <Trans id="nin.ninki.suggestions.waste.content">
				Avoid using <ActionLink action="DOKUMORI"/> and <ActionLink action="MEISUI"/> when above 40 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: this.ninkiGauge.overCap,
			why: <Trans id="nin.ninki.suggestions.waste.why">
				Overcapping caused you to lose {this.ninkiGauge.overCap} Ninki over the fight.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HELLFROG_MEDIUM.icon,
			content: <Trans id="nin.ninki.suggestions.hellfrog.content">
				Avoid using <ActionLink action="HELLFROG_MEDIUM"/> when you have fewer than three targets, as <ActionLink action="BHAVACAKRA"/> is otherwise a potency gain.
			</Trans>,
			tiers: FROG_SEVERITY,
			value: this.erroneousHellfrogs,
			why: <Trans id="nin.ninki.suggestions.hellfrog.why">
				You used Hellfrog Medium <Plural value={this.erroneousHellfrogs} one="# time" other="# times"/> when other spenders were available.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEATHFROG_MEDIUM.icon,
			content: <Trans id="nin.ninki.suggestions.deathfrog.content">
				Avoid using <ActionLink action="DEATHFROG_MEDIUM"/> when you have fewer than two targets, as <ActionLink action="ZESHO_MEPPO"/> is otherwise a potency gain.
			</Trans>,
			tiers: FROG_SEVERITY,
			value: this.erroneousDeathfrogs,
			why: <Trans id="nin.ninki.suggestions.deathfrog.why">
				You used Deathfrog Medium <Plural value={this.erroneousDeathfrogs} one="# time" other="# times"/> when other spenders were available.
			</Trans>,
		}))
	}
}
