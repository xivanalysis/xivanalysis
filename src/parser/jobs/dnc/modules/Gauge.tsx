import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {Cause, Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {EventHook, TimestampHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import {ResourceDatum, ResourceGraphs} from 'parser/core/modules/ResourceGraphs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {FINISHES} from '../CommonData'

type GaugeEventType =
	| 'init'
	| 'generate'
	| 'spend'
	| 'death'

interface DancerResourceDatum extends ResourceDatum {
	type: GaugeEventType, // Need to know if the resource event was a generator or a spender, used for graph smoothing
}

interface DancerGauge {
	currentAmount: number,
	overcapAmount: number,
	maximum: number,
	history: DancerResourceDatum[],
}

// More lenient than usual due to the probable unreliability of the data.
const GAUGE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

const ESPRIT_GENERATION_AMOUNT = 10

const TICK_FREQUENCY = 3000
const MAX_IMPROV_TICKS = 5

const ESPRIT_RATE_SELF = 0.3
const ESPRIT_RATE_PARTY = 0.2
const FEATHER_GENERATION_CHANCE = .5

const MAX_ESPRIT = 100
const SABER_DANCE_COST = 50
const MAX_FEATHERS = 4

export class Gauge extends Analyser {
	static override handle = 'gauge'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private resourceGraphs!: ResourceGraphs

	private espritGauge: DancerGauge = {
		currentAmount: 0,
		overcapAmount: 0,
		maximum: MAX_ESPRIT,
		history: [{time: this.parser.pull.timestamp, current: 0, maximum: MAX_ESPRIT, type: 'init'}],
	}
	private featherGauge: DancerGauge = {
		currentAmount: 0,
		overcapAmount: 0,
		maximum: MAX_FEATHERS,
		history: [{time: this.parser.pull.timestamp, current: 0, maximum: MAX_FEATHERS, type: 'init'}],
	}
	private espritStatuses = [
		this.data.statuses.ESPRIT.id,
		this.data.statuses.ESPRIT_TECHNICAL.id,
	]
	private espritBuffs: Map<string, EventHook<Events['damage']>> = new Map<string, EventHook<Events['damage']>>()
	private improvisers: string[] = []
	private everImproviser: string[] = []
	private improvTickHook!: TimestampHook
	private improvTicks: number = 0

	private espritGenerationExceptions = [
		...FINISHES,
		this.data.actions.FUMA_SHURIKEN.id,
		this.data.actions.FUMA_SHURIKEN_TCJ_TEN.id,
		this.data.actions.FUMA_SHURIKEN_TCJ_CHI.id,
		this.data.actions.FUMA_SHURIKEN_TCJ_JIN.id,
		this.data.actions.KATON.id,
		this.data.actions.KATON_TCJ.id,
		this.data.actions.RAITON_TCJ.id,
		this.data.actions.RAITON_TCJ.id,
		this.data.actions.HYOTON_TCJ.id,
		this.data.actions.HYOTON_TCJ.id,
		this.data.actions.GOKA_MEKKYAKU.id,
		this.data.actions.HYOSHO_RANRYU.id,
		this.data.actions.SUITON.id,
		this.data.actions.SUITON_TCJ.id,
		this.data.actions.KAESHI_GOKEN.id,
		this.data.actions.KAESHI_HIGANBANA.id,
		this.data.actions.KAESHI_SETSUGEKKA.id,
	]

	private featherGenerators: ActionKey[] = [
		'REVERSE_CASCADE',
		'FOUNTAINFALL',
		'RISING_WINDMILL',
		'BLOODSHOWER',
	]

	private featherConsumers = [
		this.data.actions.FAN_DANCE.id,
		this.data.actions.FAN_DANCE_II.id,
	]

	private pauseGeneration = false;

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const statusApplyFilter = playerFilter.type('statusApply')
		const statusRemoveFilter = playerFilter.type('statusRemove')
		const damageFilter = playerFilter.type('damage')

		this.addEventHook(statusApplyFilter.status(oneOf(this.espritStatuses)), this.addEspritGenerationHook)
		this.addEventHook(statusRemoveFilter.status(oneOf(this.espritStatuses)), this.removeEspritGenerationHook)

		this.addEventHook(statusApplyFilter.status(this.data.statuses.IMPROVISATION.id), this.startImprov)
		this.addEventHook(statusApplyFilter.status(this.data.statuses.IMPROVISATION_HEALING.id), this.onGainImprov)
		this.addEventHook(statusRemoveFilter.status(this.data.statuses.IMPROVISATION_HEALING.id), this.onRemoveImprov)
		this.addEventHook(statusRemoveFilter.status(this.data.statuses.IMPROVISATION.id), this.endImprov)

		this.addEventHook(damageFilter.cause(filter<Cause>().action(this.data.actions.SABER_DANCE.id)), this.onConsumeEsprit)

		this.addEventHook(damageFilter.cause(filter<Cause>().action(this.data.matchActionId(this.featherGenerators))), this.onCastGenerator)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.featherConsumers)), this.onConsumeFeather)

		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook({
			type: 'raise',
			actor: this.parser.actor.id,
		}, this.onRaise)
		this.addEventHook('complete', this.onComplete)
	}

	public feathersSpentInRange(start: number, end: number): number {
		if (start > end) {
			return -1
		}
		return this.featherGauge.history.filter(event => start <= event.time && event.time <= end && event.type === 'spend').length
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
		// Off GCDs generally don't count as weaponskills, so ignore them
		if (!action?.onGcd) {
			return
		}

		// Some on-GCD damaging actions are classified as 'Abilities' rather than Weaponskills or Spells. Ignore them
		if (this.espritGenerationExceptions.includes(action.id)) {
			return
		}

		// Transform the probabilistic esprit generation chance into an expected value
		// As far as we know, the chance of the DNC themselves generating Esprit is slightly higher than the chance for party members to do so
		const expectedGenerationChance = event.source === this.parser.actor.id ? ESPRIT_RATE_SELF : ESPRIT_RATE_PARTY
		const generatedAmt = ESPRIT_GENERATION_AMOUNT * expectedGenerationChance

		this.generateGauge(this.espritGauge, generatedAmt)
	}

	// Reset current improvisatio data when the action is executed
	private startImprov() {
		this.improvTicks = 0
		this.improvisers = []
		this.everImproviser = []
	}

	// When a party member gains the healing buff from improvisation, keep track of them
	private onGainImprov(event: Events['statusApply']) {
		const eventActor = event.target
		// If the party member isn't in the current list of improvisers, add them
		if (this.improvisers.indexOf(eventActor) <= -1) {
			this.improvisers.push(eventActor)
		}
		// If the party member hasn't yet been hit by this improvisation window note that as well
		if (this.everImproviser.indexOf(eventActor) <= -1) {
			this.everImproviser.push(eventActor)

			// If we haven't yet recorded a tic of Esprit generation from Improv, move the timestamp hook ahead a bit to make sure the first tic accounts for everyone that receives the initial buff
			if (this.improvTicks === 0) {
				if (this.improvTickHook) {
					this.removeTimestampHook(this.improvTickHook)
				}
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				this.improvTickHook = this.addTimestampHook(event.timestamp + 5, this.onTickImprov) // Set this just a bit in the future in case of latency weirdness with the status applications
			}
		}
	}

	// When a party member loses the healing buff from improvisation, drop them from the list of current improvisers
	private onRemoveImprov(event: Events['statusRemove']) {
		const eventActor = event.target
		const actorIndex = this.improvisers.indexOf(eventActor)
		if (actorIndex > -1) {
			this.improvisers.splice(actorIndex, 1)
		}
	}

	// When the player loses the Improvisation buff, remove the remaining timestamp hook
	private endImprov() {
		this.removeTimestampHook(this.improvTickHook)
	}

	// When improvisation ticks, generate Esprit and set up the next tick if necessary
	private onTickImprov() {
		const improviserCount = this.improvisers.length
		const generatedAmt = 2 + improviserCount
		this.generateGauge(this.espritGauge, generatedAmt)

		// Technically we don't need this check since we'll remove the hook in endImprov but eh
		if (++this.improvTicks < MAX_IMPROV_TICKS) {
			this.addTimestampHook(this.parser.currentTimestamp + TICK_FREQUENCY, this.onTickImprov)
		}
	}

	private onConsumeEsprit() {
		this.spendGauge(this.espritGauge, SABER_DANCE_COST)
	}

	private onCastGenerator() {
		this.generateGauge(this.featherGauge, FEATHER_GENERATION_CHANCE)
	}

	private onConsumeFeather() {
		this.spendGauge(this.featherGauge, 1)
	}

	// Zero out gauges, and pause Esprit generation from living party members while dead
	private onDeath() {
		this.pauseGeneration = true
		this.setGauge(this.espritGauge, 0, 'death')
		this.setGauge(this.featherGauge, 0, 'death')
	}

	// Re-enable Esprit generation from living party members once alive again
	private onRaise() {
		this.pauseGeneration = false
		this.setGauge(this.espritGauge, 0, 'init')
		this.setGauge(this.featherGauge, 0, 'init')
	}

	/* Gauge Event Helpers */
	private generateGauge(gauge: DancerGauge, generatedAmount: number) {
		if (generatedAmount > 0) {
			this.setGauge(gauge, gauge.currentAmount + generatedAmount, 'generate')
		}
	}

	private spendGauge(gauge: DancerGauge, spentAmount: number) {
		// If we spent gauge that we don't think we have right now, fix the history to show that we obviously did
		if (gauge.currentAmount < spentAmount) {
			this.correctGaugeHistory(gauge.history, spentAmount, gauge.currentAmount)
		}

		this.setGauge(gauge, gauge.currentAmount - spentAmount, 'spend')
	}

	private setGauge(gauge: DancerGauge, newAmount: number, type: GaugeEventType) {
		gauge.currentAmount = _.clamp(newAmount, 0, gauge.maximum)
		gauge.overcapAmount += Math.max(0, newAmount - gauge.currentAmount)

		gauge.history.push({time: this.parser.currentEpochTimestamp, current: gauge.currentAmount, type, maximum: gauge.maximum})
	}

	/** Dancer's gauges are both probabilistic, so we have to do some fudging to produce a realistic-looking graph */
	private correctGaugeHistory(historyObject: DancerResourceDatum[], spenderCost: number, currentGauge: number) {
		const lastGeneratorIndex = _.findLastIndex(historyObject, event => event.type === 'generate' || event.type === 'init') // Get the last generation event we've recorded

		// Add the amount we underran the simulation by to the last generation event, and all events through the current one
		const underrunAmount = Math.abs(currentGauge - spenderCost)
		for (let i = lastGeneratorIndex; i < historyObject.length; i++) {
			historyObject[i].current += underrunAmount
		}

		// If the last generator was also the first event (dungeons with stocked resources, etc.), we're done
		if (lastGeneratorIndex === 0) {
			return
		}

		// Find the first spender or init event previous to the last generator we already found, and smooth the graph between the two events by adding a proportional amount of the underrun value to each event
		const previousSpenderIndex = _.findLastIndex(historyObject.slice(0, lastGeneratorIndex), event => (event.type === 'spend' || event.type === 'init'))
		const adjustmentPerEvent = underrunAmount / (lastGeneratorIndex - previousSpenderIndex)
		for (let i = previousSpenderIndex + 1; i < lastGeneratorIndex; i ++) {
			historyObject[i].current += adjustmentPerEvent * (i - previousSpenderIndex)
		}
	}

	/* Parse Completion and output */
	private onComplete() {

		this.resourceGraphs.addGauge({
			label: <Trans id="dnc.gauge.resource.feathers">Feathers</Trans>,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			colour: Color.rgb(140.6, 161.1, 70.8).fade(0.25).toString(),
			data: this.featherGauge.history,
		})
		this.resourceGraphs.addGauge({
			label: <Trans id="dnc.gauge.resource.esprit">Esprit</Trans>,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			colour: Color(JOBS.DANCER.colour).fade(0.25).toString(),
			data: this.espritGauge.history,
		})

		const missedSaberDances = Math.floor(this.espritGauge.overcapAmount/SABER_DANCE_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SABER_DANCE.icon,
			content: <Trans id="dnc.esprit.suggestions.overcapped-esprit.content">
				You may have lost uses of <ActionLink {...this.data.actions.SABER_DANCE} /> due to overcapping your Esprit gauge. Make sure you use it, especially if your gauge is above 80.
			</Trans>,
			tiers: GAUGE_SEVERITY_TIERS,
			value: missedSaberDances,
			why: <Trans id="dnc.esprit.suggestions.overcapped-esprit.why">
				<Plural value={missedSaberDances} one="# Saber Dance" other="# Saber Dances"/> may have been missed.
			</Trans>,
		}))

		const featherOvercap = Math.floor(this.featherGauge.overcapAmount)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FAN_DANCE_III.icon,
			content: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.content">
				You may have lost uses of your <ActionLink {...this.data.actions.FAN_DANCE} />s due to using one of your procs while already holding four feathers. Make sure to use a feather with <ActionLink showIcon={false} {...this.data.actions.FAN_DANCE} /> or <ActionLink showIcon={false} {...this.data.actions.FAN_DANCE_II} /> before using a proc to prevent overcapping.
			</Trans>,
			tiers: GAUGE_SEVERITY_TIERS,
			value: featherOvercap,
			why: <Trans id="dnc.feather-gauge.suggestions.overcapped-feathers.why">
				<Plural value={featherOvercap} one="# feather" other="# feathers"/> may have been lost.
			</Trans>,
		}))
	}
}
