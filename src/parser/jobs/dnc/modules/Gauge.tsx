import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS, JobKey} from 'data/JOBS'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

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

// These are generally the on-GCD 'Abilities' such as NIN's Ninjutsu and SAM's Tsubame Iaijutsu
const ESPRIT_EXCEPTIONS_PARTY: ActionKey[] = [
	'FUMA_SHURIKEN',
	'FUMA_SHURIKEN_TCJ_TEN',
	'FUMA_SHURIKEN_TCJ_CHI',
	'FUMA_SHURIKEN_TCJ_JIN',
	'KATON',
	'KATON_TCJ',
	'RAITON_TCJ',
	'HYOTON_TCJ',
	'GOKA_MEKKYAKU',
	'HYOSHO_RANRYU',
	'SUITON',
	'SUITON_TCJ',
	'KAESHI_GOKEN',
	'KAESHI_HIGANBANA',
	'KAESHI_SETSUGEKKA',
	'KAESHI_NAMIKIRI',
]

const ESPRIT_GENERATION_AMOUNT_PARTY = 10
const ESPRIT_RATE_PARTY_DEFAULT = 0.2

/* eslint-disable @typescript-eslint/no-magic-numbers */
const ESPRIT_RATE_PARTY_TESTED = new Map<JobKey, number>([
	['MONK', 0.17],
	['DRAGOON', 0.18],
	['NINJA', 0.16],
	['SAMURAI', 0.19],
	['BLACK_MAGE', 0.25],
	['RED_MAGE', 0.21],
])
/* eslint-enable @typescript-eslint/no-magic-numbers */

const ESPRIT_GENERATION_AMOUNT_COMBO = 5
const ESPRIT_GENERATION_AMOUNT_PROC = 10

const SABER_DANCE_COST = 50

/** Graph colors */
const FADE_AMOUNT = 0.25
const ESRPIT_COLOR = Color(JOBS.DANCER.colour).fade(FADE_AMOUNT)
const FEATHERS_COLOR = Color('#8DA147').fade(FADE_AMOUNT)

export class Gauge extends CoreGauge {
	@dependency private actors!: Actors
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

	private espritGenerationExceptionIds: number[] = ESPRIT_EXCEPTIONS_PARTY.map(key => this.data.actions[key].id)

	private espritGeneratorsSelf = new Map<number, number>([
		[this.data.actions.CASCADE.id, ESPRIT_GENERATION_AMOUNT_COMBO],
		[this.data.actions.FOUNTAIN.id, ESPRIT_GENERATION_AMOUNT_COMBO],
		[this.data.actions.WINDMILL.id, ESPRIT_GENERATION_AMOUNT_COMBO],
		[this.data.actions.BLADESHOWER.id, ESPRIT_GENERATION_AMOUNT_COMBO],
		[this.data.actions.REVERSE_CASCADE.id, ESPRIT_GENERATION_AMOUNT_PROC],
		[this.data.actions.FOUNTAINFALL.id, ESPRIT_GENERATION_AMOUNT_PROC],
		[this.data.actions.RISING_WINDMILL.id, ESPRIT_GENERATION_AMOUNT_PROC],
		[this.data.actions.BLOODSHOWER.id, ESPRIT_GENERATION_AMOUNT_PROC],
	])

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

		const action = this.data.getAction(event.cause.action)
		if (action == null) { return }

		if (!action.onGcd) {
			return
		}

		if (this.espritGenerationExceptionIds.includes(action.id)) {
			return
		}

		const eventActor = this.actors.get(event.source)
		// Determine how much Esprit is being generated. Differs if it's the player generating for themselves, or if it's another member of the party generating for the player
		const generatedAmt = event.source === this.parser.actor.id ?
			// The dancer's own generation is limited to the 4 combo GCDs and the 4 proc GCDs, so get the amount from the map
			this.espritGeneratorsSelf.get(action.id) ?? 0 :
			// The party has a ~20% chance to generate 10 Esprit for the player
			// For the jobs that theorycrafters have determined a more precise rate, use that instead
			ESPRIT_GENERATION_AMOUNT_PARTY * (ESPRIT_RATE_PARTY_TESTED.get(eventActor.job) ?? ESPRIT_RATE_PARTY_DEFAULT)

		// If we actually generate something, add it to the gauge
		if (generatedAmt > 0) {
			this.espritGauge.generate(generatedAmt)
		}
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
