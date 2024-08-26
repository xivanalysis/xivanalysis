import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter, noneOf, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React from 'react'
import {CooldownDowntime} from './CooldownDowntime'

/** Addersgall configuration */
const ADDERSGALL_MAX_STACKS = 3
const ADDERSGALL_TIME_REQUIRED = 20000

const ADDERSGALL_CONSUMERS: ActionKey[] = [
	'DRUOCHOLE',
	'IXOCHOLE',
	'KERACHOLE',
	'TAUROCHOLE',
]

const OVERWRITES_SHIELDS: StatusKey[] = [
	'EUKRASIAN_DIAGNOSIS',
	'EUKRASIAN_PROGNOSIS',
	'GALVANIZE',
]

/** Addersting configuration */
const ADDERSTING_MAX_STACKS = 3

const ADDERSTING_CONSUMERS: ActionKey[] = [
	'TOXIKON',
	'TOXIKON_II',
]

/** Shield-tracking object interface */
interface ShieldData {
	applyTimestamp?: number,
	removeTimestamp?: number,
	remainingShield?: number,
	consumedOrOverwritten?: boolean
}

/** Graph colors/fade settings */
const GAUGE_FADE = 0.25
const TIMER_FADE = 0.75
const ADDERSGALL_COLOR = Color(JOBS.SAGE.colour)
const ADDERSTING_COLOR = Color('#9e2dca')

export class Gauge extends CoreGauge {
	@dependency private actors!: Actors
	@dependency private cooldownDowntime!: CooldownDowntime
	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions
	@dependency private unableToAct!: UnableToAct

	private trackedShields: Partial<Record<Actor['id'], ShieldData>> = {}

	private rhizomataLoss: number = 0
	private rhizomatasUsed: number = 0

	private adderstingGauge = this.add(new CounterGauge({
		maximum: ADDERSTING_MAX_STACKS,
		initialValue: ADDERSTING_MAX_STACKS,
		graph: {
			handle: 'addersting',
			label: <Trans id="sge.gauge.resource.addersting">Addersting</Trans>,
			color: ADDERSTING_COLOR.fade(GAUGE_FADE),
			forceCollapsed: true,
		},
		correctHistory: true,
	}))
	private addersgallGauge = this.add(new CounterGauge({
		maximum: ADDERSGALL_MAX_STACKS,
		initialValue: ADDERSGALL_MAX_STACKS,
		graph: {
			handle: 'addersgall',
			label: <Trans id="sge.gauge.resource.addersgall">Addersgall</Trans>,
			color: ADDERSGALL_COLOR.fade(GAUGE_FADE),
			forceCollapsed: true,
		},
		correctHistory: true,
	}))
	private addersgallTimer = this.add(new TimerGauge({
		maximum: ADDERSGALL_TIME_REQUIRED,
		onExpiration: this.onCompleteAddersgallTimer.bind(this),
		graph: {
			handle: 'addersgall',
			label: <Trans id="sge.gauge.resource.addersgall-timer">Addersgall Timer</Trans>,
			color: ADDERSGALL_COLOR.fade(TIMER_FADE),
		},
	}))

	override initialise() {
		super.initialise()

		// Initial filter setup
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const partyIds = this.actors.friends.filter(friend => friend.playerControlled).map(friend => friend.id)
		const partyFilter = filter<Event>().target(oneOf(partyIds))
		const playerDiagnosisPartyFilter = partyFilter.source(this.parser.actor.id).status(this.data.statuses.EUKRASIAN_DIAGNOSIS.id)
		const playerPrognosisSelfFilter = playerFilter.target(this.parser.actor.id).status(this.data.statuses.EUKRASIAN_PROGNOSIS.id)

		// Hook Addersgall consumer and generator actions
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(ADDERSGALL_CONSUMERS)), this.onConsumeAddersgall)
		this.addEventHook(playerFilter.action(this.data.actions.RHIZOMATA.id), this.onRhizomata)

		// Hook shield applications/removals that could generate Addersting
		this.addEventHook(playerDiagnosisPartyFilter.type('statusApply'), this.onShieldApply)
		this.addEventHook(playerDiagnosisPartyFilter.type('statusRemove'), this.onShieldRemove)
		// Self-targeted Prognosis can generate Addersting
		this.addEventHook(playerPrognosisSelfFilter.type('statusApply'), this.onShieldApply)
		this.addEventHook(playerPrognosisSelfFilter.type('statusRemove'), this.onShieldRemove)

		// Hook shield applications/actions that could prevent Addersting generation
		this.addEventHook(partyFilter.type('statusApply').source(noneOf([this.parser.actor.id])).status(this.data.matchStatusId(OVERWRITES_SHIELDS)), this.onShieldOverwrite)
		this.addEventHook(playerFilter.action(this.data.actions.PEPSIS.id), this.onPepsis)

		// Hook Addersting consumption
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(ADDERSTING_CONSUMERS)), () => this.adderstingGauge.spend(1))

		this.addEventHook('complete', this.onComplete)
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
		this.rhizomatasUsed++
		this.addersgallGauge.generate(1)
		if (this.addersgallGauge.capped) {
			this.rhizomataLoss += ADDERSGALL_TIME_REQUIRED - this.addersgallTimer.remaining
			this.addersgallTimer.reset()
		}
	}
	//#endregion

	//#region Addersting gauge
	// Keep track of relevant Eukrasian shield applications
	private onShieldApply(event: Events['statusApply']) {
		this.trackedShields[event.target] = {applyTimestamp: event.timestamp}
	}

	// Keep track of instances where a relevant Eukrasian shield was definitely overwritten by another status
	private onShieldOverwrite(event: Events['statusApply']) {
		const shield = this.trackedShields[event.target]
		if (shield == null) { return }
		shield.consumedOrOverwritten = true
	}

	// Keep track of shield removals, and set a timestamp hook to resolve the shield (overwrites happen 'after' the removal event but at the same timestamp, so we can't know for sure if the shield was overwritten yet)
	private onShieldRemove(event: Events['statusRemove']) {
		const shield = this.trackedShields[event.target]
		if (shield == null) { return }
		shield.removeTimestamp = event.timestamp
		shield.remainingShield = event.remainingShield
		this.addTimestampHook(event.timestamp + 1, () => this.onResolveShield(event.target))
	}

	// Resolve the shield and grant an Addersting if we're reasonably sure the shield wasn't overwritten or wore off due to time
	private onResolveShield(target: string) {
		const shield = this.trackedShields[target]
		if (shield == null) { return }
		if (shield.consumedOrOverwritten !== true) {
			const shieldDuration = (shield.removeTimestamp ?? this.parser.currentEpochTimestamp) - (shield.applyTimestamp ?? this.parser.pull.timestamp)
			// Absorbed doesn't give us an actual look at the real total absorbed, so we have to just assume that a non-overwritten removal before the duration that absorbed anything was a full break
			// Diagnosis and Prognosis also have the same shield duration, so we'll just pick one since we're not tracking exactly which shield this is at the moment...
			if ((shield.remainingShield != null && shield.remainingShield === 0) && shieldDuration < this.data.statuses.EUKRASIAN_DIAGNOSIS.duration) {
				this.adderstingGauge.generate(1)
			}
		}
		this.trackedShields[target] = undefined
	}

	// Pepsis consumes all active shields, which doesn't grant Addersting
	private onPepsis() {
		for (const key in this.trackedShields) {
			const shield = this.trackedShields[key]
			if (shield != null) {
				shield.consumedOrOverwritten = true
			}
		}
	}
	//#endregion

	private onComplete() {
		const addersgallLeniency = ADDERSGALL_TIME_REQUIRED / 2 + this.parser.pull.timestamp
		const forceGainUtaWindows = this.unableToAct.getWindows().filter(uta => Math.max(0, uta.end - uta.start) >= ADDERSGALL_TIME_REQUIRED)
		const addersgallExpirationTime = this.addersgallTimer.getExpirationTime(addersgallLeniency, this.parser.currentEpochTimestamp, forceGainUtaWindows, addersgallLeniency)
		const lostAddersgall = Math.floor(addersgallExpirationTime / ADDERSGALL_TIME_REQUIRED)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.KERACHOLE.icon,
			content: <Trans id="sge.gauge.suggestions.lost-addersgall.content">
				You lost Addersgall due to capping the gauge and letting the timer stop. Your Addersgall actions are your primary healing and mitigation tools, as well as contributing to your MP recovery, so you should try to use another one before regaining your third stack.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: lostAddersgall,
			why: <Trans id="sge.gauge.suggestions.lost-addersgall.why">
				<Plural value={lostAddersgall} one="# Addersgall stack was" other="# Addersgall stacks were"/> lost to timer inactivity.
			</Trans>,
		}))

		const rhizomataLostStacks = Math.floor(this.rhizomataLoss / ADDERSGALL_TIME_REQUIRED)
		if (rhizomataLostStacks > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.KERACHOLE.icon,
				content: <Trans id="sge.gauge.suggestions.lost-to-rhizomata.content">
					You lost Addersgall due to capping the gauge with <DataLink action="RHIZOMATA" />, which wastes the time already spent charging the third stack. Try to use <DataLink showIcon={false} action="RHIZOMATA" /> when you are at one stack or less to keep from losing timer progress.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="sge.gauge.suggestions.lost-to-rhizomata.why">
					<Plural value={rhizomataLostStacks} one="# Addersgall stack was" other="# Addersgall stacks were"/> lost to capping the gauge with <DataLink showIcon={false} action="RHIZOMATA" />.
				</Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TOXIKON_II.icon,
			content: <Trans id="sge.gauge.suggestions.addersting-overcap.content">
				<DataLink action="TOXIKON_II" /> is a useful movement and weaving tool, and does the same single-target DPS as <DataLink action="DOSIS_III" />. Try not to waste them by breaking a fourth <DataLink status="EUKRASIAN_DIAGNOSIS" /> or self-targeted <DataLink showIcon={false} status="EUKRASIAN_PROGNOSIS" /> shield before using an Addersting stack.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this.adderstingGauge.overCap,
			why: <Trans id="sge.gauge.suggestions.addersting-overcap.why">
				<Plural value={this.adderstingGauge.overCap} one="# Addersting stack" other="# Addersting stacks"/> lost due to overcap.
			</Trans>,
		}))

		const unusedRhizomatas = Math.max(this.cooldownDowntime.calculateMaxUsages({cooldowns: [this.data.actions.RHIZOMATA]}) - this.rhizomatasUsed, 0)
		// Calculate the number of possible addersgall stacks the player could have used
		let potentialAddersgalls = ADDERSGALL_MAX_STACKS // Initial stacks
			+ this.addersgallGauge.totalGenerated // Total addersgall generated by timer or Rhizomata usage
			+ lostAddersgall // Calculated addersgall loss (minus forced UTA gain calculated earlier)
			+ unusedRhizomatas // The number of Rhizomatas that went unused,
		if (process.env.NODE_ENV === 'production') {
			potentialAddersgalls = Math.max(potentialAddersgalls, this.addersgallGauge.totalSpent) // In production, bump potential up to total spent if it was lower, in case our uta leniency was too lenient or something
		}
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="sge.gauge.statistics.addersgall-used">Addersgall Stacks Used</Trans>,
			icon: this.data.actions.DRUOCHOLE.icon,
			value: <>{this.addersgallGauge.totalSpent} / {potentialAddersgalls}</>,
			info: (
				<Trans id="sge.gauge.statistics.addersgall-used.info">The denominator is calculated as if you kept the Addersgall timer running essentially the entire fight, and maximized your uses of <DataLink action="RHIZOMATA" />.</Trans>
			),
		}))
	}
}
