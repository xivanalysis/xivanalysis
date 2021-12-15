import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {FINISHES} from '../CommonData'

// More lenient than usual due to the probable unreliability of the data.
const GAUGE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

/** Feather configuration */
const FEATHER_GENERATORS: ActionKey[] = [
	'REVERSE_CASCADE',
	'FOUNTAINFALL',
	'RISING_WINDMILL',
	'BLOODSHOWER',
]
const FEATHER_CONSUMERS: ActionKey[] = [
	'FAN_DANCE',
	'FAN_DANCE_II',
]
const FEATHER_GENERATION_CHANCE = .5
const MAX_FEATHERS = 4

/** Esprit configuration */
const ESPRIT_STATUSES: StatusKey[] = [
	'ESPRIT',
	'ESPRIT_TECHNICAL',
]
const ESPRIT_EXCEPTIONS: ActionKey[] = [
	...FINISHES,
	'TILLANA', // TODO: I'm assuming this won't generate Esprit since it's classed as an Ability in the tooltip
	'FUMA_SHURIKEN',
	'FUMA_SHURIKEN_TCJ_TEN',
	'FUMA_SHURIKEN_TCJ_CHI',
	'FUMA_SHURIKEN_TCJ_JIN',
	'KATON',
	'KATON_TCJ',
	'RAITON_TCJ',
	'RAITON_TCJ',
	'HYOTON_TCJ',
	'HYOTON_TCJ',
	'GOKA_MEKKYAKU',
	'HYOSHO_RANRYU',
	'SUITON',
	'SUITON_TCJ',
	'KAESHI_GOKEN',
	'KAESHI_HIGANBANA',
	'KAESHI_SETSUGEKKA',
]

const PROC_ACTIONS: ActionKey[] = [
	'REVERSE_CASCADE',
	'RISING_WINDMILL',
	'FOUNTAINFALL',
	'BLOODSHOWER',
	'FAN_DANCE_IV',
	'STARFALL_DANCE', // TBD if this has the guaranteed 10 Esprit effect that the others do
]

const ESPRIT_GENERATION_AMOUNT = 10
const ESPRIT_RATE_SELF_NON_PROC = 0.5
const ESPRIT_RATE_PARTY = 0.2

const SABER_DANCE_COST = 50

/** Graph colors */
const FADE_AMOUNT = 0.25
const ESRPIT_COLOR = Color(JOBS.DANCER.colour).fade(FADE_AMOUNT)
const FEATHERS_COLOR = Color('#8DA147').fade(FADE_AMOUNT)

export class Gauge extends CoreGauge {
	@dependency private suggestions!: Suggestions

	private featherGauge = this.add(new CounterGauge({
		maximum: MAX_FEATHERS,
		graph: {
			label: <Trans id="dnc.gauge.resource.feathers">Feathers</Trans>,
			color: FEATHERS_COLOR,
		},
		correctHistory: true,
		deterministic: false,
	}))
	private espritGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="dnc.gauge.resource.esprit">Esprit</Trans>,
			color: ESRPIT_COLOR,
		},
		correctHistory: true,
		deterministic: false,
	}))

	private espritBuffs: Map<string, EventHook<Events['damage']>> = new Map<string, EventHook<Events['damage']>>()

	private espritGenerationExceptions: number[] = ESPRIT_EXCEPTIONS.map(key => this.data.actions[key].id)
	private fullEspritActions = PROC_ACTIONS.map(key => this.data.actions[key].id)
	protected pauseGeneration = false;

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const statusApplyFilter = playerFilter.type('statusApply')
		const statusRemoveFilter = playerFilter.type('statusRemove')
		const damageFilter = playerFilter.type('damage')
		const espritStatusMatcher = this.data.matchStatusId(ESPRIT_STATUSES)

		this.addEventHook(statusApplyFilter.status(espritStatusMatcher), this.addEspritGenerationHook)
		this.addEventHook(statusRemoveFilter.status(espritStatusMatcher), this.removeEspritGenerationHook)

		this.addEventHook(damageFilter.cause(this.data.matchCauseActionId([this.data.actions.SABER_DANCE.id])), this.onConsumeEsprit)

		this.addEventHook(damageFilter.cause(this.data.matchCauseAction(FEATHER_GENERATORS)), this.onCastGenerator)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(FEATHER_CONSUMERS)), this.onConsumeFeather)

		this.addEventHook('complete', this.onComplete)
	}

	override onDeath(event: Events['death']) {
		super.onDeath(event)
		this.pauseGeneration = true
	}

	override onRaise() {
		super.onRaise()
		this.pauseGeneration = false
	}

	public feathersSpentInRange(start: number, end: number): number {
		if (start > end) {
			return -1
		}
		return this.featherGauge.history.filter(event => start <= event.timestamp && event.timestamp <= end && event.reason === 'spend').length
	}

	/* Esprit buff application/removal hooks */
	private addEspritGenerationHook(event: Events['statusApply']) {
		const eventActor = event.target
		if (this.espritBuffs.get(eventActor) == null) {
			const eventFilter = filter<Event>()
				.type('damage')
				.source(eventActor)
			this.espritBuffs.set(eventActor, this.addEventHook(eventFilter, this.onDamage))
		}
	}

	private removeEspritGenerationHook(event: Events['statusRemove']) {
		const eventActor = event.target
		if (this.espritBuffs.has(eventActor)) {
			const eventHook = this.espritBuffs.get(eventActor)
			if (eventHook == null) {
				return
			}
			this.removeEventHook(eventHook)
			this.espritBuffs.delete(eventActor)
		}
	}

	/* Gauge Event Hooks */
	private onDamage(event: Events['damage']) {
		if (this.pauseGeneration) {
			return
		}

		if (event.cause.type !== 'action') {
			return
		}
		const ability = event.cause.action
		const action = this.data.getAction(ability)
		if (action == null) { return }

		// Off GCDs generally don't count as weaponskills, so ignore them
		if (!action.onGcd) {
			return
		}

		// Some on-GCD damaging actions are classified as 'Abilities' rather than Weaponskills or Spells. Ignore them
		if (this.espritGenerationExceptions.includes(action.id)) {
			return
		}

		// Transform the probabilistic esprit generation chance into an expected value
		const expectedGenerationChance = event.source === this.parser.actor.id ?
			// If the dancer is generating Esprit for themselves from a proc, they gain the full ten Esprit every time
			(this.fullEspritActions.includes(ability) ? 1 :
			// Otherwise, the dancer generates 5 Esprit for themselves with each action
				ESPRIT_RATE_SELF_NON_PROC) :
			// Party members with either the Standard Finish or Technical Finish-sourced Esprit buff generate ten Esprit at a 20% chance
			ESPRIT_RATE_PARTY
		const generatedAmt = ESPRIT_GENERATION_AMOUNT * expectedGenerationChance

		this.espritGauge.generate(generatedAmt)
	}

	private onConsumeEsprit() {
		this.espritGauge.spend(SABER_DANCE_COST)
	}

	private onCastGenerator() {
		this.featherGauge.generate(FEATHER_GENERATION_CHANCE)
	}

	private onConsumeFeather() {
		this.featherGauge.spend(1)
	}

	/* Parse Completion and output */
	private onComplete() {
		const missedSaberDances = Math.floor(this.espritGauge.overCap / SABER_DANCE_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SABER_DANCE.icon,
			content: <Trans id="dnc.esprit.suggestions.overcapped-esprit.content">
				You may have lost uses of <DataLink action="SABER_DANCE" /> due to overcapping your Esprit gauge. Make sure you use it, especially if your gauge is above 80.
			</Trans>,
			tiers: GAUGE_SEVERITY_TIERS,
			value: missedSaberDances,
			why: <Trans id="dnc.esprit.suggestions.overcapped-esprit.why">
				<Plural value={missedSaberDances} one="# Saber Dance" other="# Saber Dances"/> may have been missed.
			</Trans>,
		}))

		const featherOvercap = Math.floor(this.featherGauge.overCap)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FAN_DANCE_III.icon,
			content: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.content">
				You may have lost uses of your <DataLink action="FAN_DANCE" />s due to using one of your procs while already holding four feathers. Make sure to use a feather with <DataLink showIcon={false} action="FAN_DANCE" /> or <DataLink showIcon={false} action="FAN_DANCE_II" /> before using a proc to prevent overcapping.
			</Trans>,
			tiers: GAUGE_SEVERITY_TIERS,
			value: featherOvercap,
			why: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.why">
				<Plural value={featherOvercap} one="# feather" other="# feathers"/> may have been lost.
			</Trans>,
		}))
	}
}
