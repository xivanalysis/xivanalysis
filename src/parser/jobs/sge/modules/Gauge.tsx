import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter, noneOf, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import React from 'react'

/** Addersgall configuration */
const ADDERSGALL_MAX_STACKS = 3
const ADDERSGALL_TIME_REQUIRED = 20000

const ADDERSGALL_CONSUMERS: ActionKey[] = [
	'DRUOCHOLE',
	'IXOCHOLE',
	'KERACHOLE',
	'TAUROCHOLE',
]

const OVERWRITES_DIAGNOSIS: StatusKey[] = [
	'EUKRASIAN_PROGNOSIS',
	'GALVANIZE',
]

/** Addersting configuration */
const ADDERSTING_MAX_STACKS = 3

const ADDERSTING_CONSUMERS: ActionKey[] = [
	'TOXIKON',
	'TOXIKON_II',
]

/** Diagnosis-tracking object interface */
interface DiagnosisData {
	applyTimestamp?: number,
	removeTimestamp?: number,
	absorbed?: number,
	consumedOrOverwritten?: boolean
}

/** Graph colors/fade settings */
const GAUGE_FADE = 0.25
const TIMER_FADE = 0.75
const ADDERSGALL_COLOR = Color(JOBS.SAGE.colour)
const ADDERSTING_COLOR = Color('#9e2dca')

export class Gauge extends CoreGauge {
	@dependency private actors!: Actors

	private diagnoses: Partial<Record<Actor['id'], DiagnosisData>> = {}

	private adderstingGauge = this.add(new CounterGauge({
		maximum: ADDERSTING_MAX_STACKS,
		graph: {
			label: <Trans id="sge.gauge.resource.addersting">Addersting</Trans>,
			color: ADDERSTING_COLOR.fade(GAUGE_FADE),
		},
		correctHistory: true,
	}))
	private addersgallGauge = this.add(new CounterGauge({
		maximum: ADDERSGALL_MAX_STACKS,
		initialValue: ADDERSGALL_MAX_STACKS,
		graph: {
			label: <Trans id="sge.gauge.resource.addsergall">Addersgall</Trans>,
			color: ADDERSGALL_COLOR.fade(GAUGE_FADE),
		},
		correctHistory: true,
	}))
	private addersgallTimer = this.add(new TimerGauge({
		maximum: ADDERSGALL_TIME_REQUIRED,
		onExpiration: this.onCompleteAddersgallTimer.bind(this),
		graph: {
			label: <Trans id="sge.gauge.resource.addersgall-timer">Addersgall Timer</Trans>,
			color: ADDERSGALL_COLOR.fade(TIMER_FADE),
		},
	}))
	private adderstingGauge = this.add(new CounterGauge({
		maximum: ADDERSTING_MAX_STACKS,
		graph: {
			label: <Trans id="sge.gauge.resource.addersting">Addersting</Trans>,
			color: ADDERSTING_COLOR.fade(GAUGE_FADE),
		},
		correctHistory: true,
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const partyIds = this.actors.friends.filter(friend => friend.playerControlled).map(friend => friend.id)
		const partyFilter = filter<Event>().target(oneOf(partyIds))
		const playerDiagnosisPartyFilter = partyFilter.source(this.parser.actor.id).status(this.data.statuses.EUKRASIAN_DIAGNOSIS.id)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(ADDERSGALL_CONSUMERS)), this.onConsumeAddersgall)
		this.addEventHook(playerFilter.action(this.data.actions.RHIZOMATA.id), this.onRhizomata)

		// Hook shield applications/removals that could generate Addersting
		this.addEventHook(playerDiagnosisPartyFilter.type('statusApply'), this.onShieldApply)
		this.addEventHook(playerDiagnosisPartyFilter.type('statusRemove'), this.onShieldRemove)

		// Hook shield applications/actions that could prevent Addersting generation
		this.addEventHook(filter<Event>().type('statusApply').source(noneOf([this.parser.actor.id]))
			.status(this.data.statuses.EUKRASIAN_DIAGNOSIS.id), this.onShieldOverwrite)
		this.addEventHook(partyFilter.type('statusApply').status(this.data.matchStatusId(OVERWRITES_DIAGNOSIS)), this.onShieldOverwrite)
		this.addEventHook(playerFilter.action(this.data.actions.PEPSIS.id), this.onPepsis)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(ADDERSTING_CONSUMERS)), () => this.adderstingGauge.spend(1))
	}

	/** Addersgall is weird, the timer restarts immediately on death, not after raising, at least in the media tour build */
	override onDeath(event: Events['death']) {
		super.onDeath(event)

		this.addersgallTimer.start()
	}

	//#region Addersgall gauge
	private onConsumeAddersgall() {
		this.addersgallGauge.spend(1)
		if (this.addersgallTimer.expired) {
			this.addersgallTimer.start()
		}
	}

	private onCompleteAddersgallTimer() {
		this.addersgallGauge.generate(1)
		if (!this.addersgallGauge.capped) {
			this.addersgallTimer.start()
		}
	}

	private onRhizomata() {
		this.addersgallGauge.generate(1)
		if (this.addersgallGauge.capped) {
			this.addersgallTimer.reset()
		}
	}
	//#endregion

	//#region Addersting gauge
	// Keep track of Eukrasian Diagnosis applications
	private onShieldApply(event: Events['statusApply']) {
		this.diagnoses[event.target] = {applyTimestamp: event.timestamp}
	}

	// Keep track of instances where a Eukrasian Diagnosis was definitely overwritten by another status
	private onShieldOverwrite(event: Events['statusApply']) {
		const diagnosis = this.diagnoses[event.target]
		if (diagnosis == null) { return }
		diagnosis.consumedOrOverwritten = true
	}

	// Keep track of shield removals, and set a timestamp hook to resolve the shield (overwrites happen 'after' the removal event but at the same timestamp, so we can't know for sure if the shield was overwritten yet)
	private onShieldRemove(event: Events['statusRemove']) {
		const diagnosis = this.diagnoses[event.target]
		if (diagnosis == null) { return }
		diagnosis.removeTimestamp = event.timestamp
		diagnosis.absorbed = event.absorbed
		this.addTimestampHook(event.timestamp + 1, () => this.onResolveShield(event.target))
	}

	// Resolve the shield and grant an Addersting if we're reasonably sure the shield wasn't overwritten or wore off due to time
	private onResolveShield(target: string) {
		const diagnosis = this.diagnoses[target]
		if (diagnosis == null) { return }
		if (diagnosis.consumedOrOverwritten !== true) {
			const diagnosisDuration = (diagnosis.removeTimestamp ?? this.parser.currentEpochTimestamp) - (diagnosis.applyTimestamp ?? this.parser.pull.timestamp)
			// Absorbed doesn't give us an actual look at the real total absorbed, so we have to just assume that a non-overwritten removal before the duration that absorbed anything was a full break
			if ((diagnosis.absorbed ?? 0) > 0 && diagnosisDuration < this.data.statuses.EUKRASIAN_DIAGNOSIS.duration) {
				this.adderstingGauge.generate(1)
			}
		}
		this.diagnoses[target] = undefined
	}

	// Pepsis consumes all active shields, which doesn't grant Addersting
	private onPepsis() {
		for (const key in this.diagnoses) {
			const diagnosis = this.diagnoses[key]
			if (diagnosis != null) {
				diagnosis.consumedOrOverwritten = true
			}
		}
	}
	//#endregion
}
