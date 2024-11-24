//I've heard it's cool to build your own job gauge.
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events, FieldsBase} from 'event'
import _ from 'lodash'
import {TimestampHookArguments} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {CounterGauge, TimerGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {EnumGauge} from 'parser/core/modules/Gauge/EnumGauge'
import {DEFAULT_ROW_HEIGHT, GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React, {Fragment} from 'react'
import {Message, Table, Button} from 'semantic-ui-react'
import {isSuccessfulHit} from 'utilities'
import {FIRE_SPELLS, ICE_SPELLS_TARGETED, ICE_SPELLS_UNTARGETED} from './Elements'

/** Configuration */
const POLYGLOT_DURATION_REQUIRED = 30000
export const ASTRAL_UMBRAL_DURATION = 15000
export const ASTRAL_UMBRAL_MAX_STACKS = 3
export const UMBRAL_HEARTS_MAX_STACKS = 3
export const ASTRAL_SOUL_MAX_STACKS = 6
const CAPPED_ASTRAL_UMBRAL_CAST_SCALAR = 0.5
const FLARE_MAX_HEART_CONSUMPTION = 3
const FLARE_SOUL_GENERATION = 3
const POLYGLOT_MAX_STACKS = 3
const PARADOX_MAX_STACKS = 1
const ASTRAL_UMBRAL_HANDLE = 'astralumbral'
const UMBRAL_ICE_HANDLE = 'umbralice'
const ASTRAL_FIRE_HANDLE = 'astralfire'
const POLYGLOT_HANDLE = 'polyglot'
const POLYGLOT_LABEL = <Trans id="blm.gauge.resource.polyglot">Polyglot</Trans>

const AFFECTS_GAUGE_ON_DAMAGE: ActionKey[] = [
	...FIRE_SPELLS,
	...ICE_SPELLS_TARGETED,
	'PARADOX',
]

const AFFECTS_GAUGE_ON_CAST: ActionKey[] = [
	...ICE_SPELLS_UNTARGETED,
	'TRANSPOSE',
	'FOUL',
	'XENOGLOSSY',
	'AMPLIFIER',
	'PARADOX',
	'MANAFONT',
	'FLARE_STAR',
]

const GAUGE_ERROR_TYPE = {
	NONE: 0,
	OVERWROTE_PARADOX: 1,
	OVERWROTE_POLYGLOT: 2,
}

/** Gauge state interface for consumers */
export interface BLMGaugeState {
	astralFire: number,
	umbralIce: number,
	umbralHearts: number,
	polyglot: number,
	enochian: boolean, // Keeping this as a calculated value to simplify RotationWatchdog's "did Enochian drop?" check
	paradox: number,
	astralSoul: number,
}

interface BLMGaugeError {
	timestamp: number,
	error: number
}

/** BLM Gauge Event interface & include in Event repository */
interface EventBLMGauge extends FieldsBase {
	type: 'blmgauge',
	gaugeState: BLMGaugeState
}
declare module 'event' {
	interface EventTypeRepository {
		blmgauge: EventBLMGauge
	}
}

/** Graph colors/fade settings */
const STANCE_FADE = 0.5
const TIMER_FADE = 0.75
const ICE_COLOR = Color('#2F70B1')
const FIRE_COLOR = Color('#D23D26')
const POLYGLOT_COLOR = Color(JOBS.BLACK_MAGE.colour)

export class Gauge extends CoreGauge {
	static override handle = 'gauge'
	static override title = t('blm.gauge.title')`Gauge`

	@dependency private suggestions!: Suggestions
	@dependency private unableToAct!: UnableToAct
	@dependency private castTime!: CastTime

	private gaugeErrors: BLMGaugeError[] = []
	private droppedEnoTimestamps: number[] = []

	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)
	private iceSpellIds = [
		...ICE_SPELLS_TARGETED.map(key => this.data.actions[key].id),
		...ICE_SPELLS_UNTARGETED.map(key => this.data.actions[key].id),
	]
	private affectsGaugeOnDamage = AFFECTS_GAUGE_ON_DAMAGE.map(key => this.data.actions[key].id)

	private castTimeIndex: number | null = null

	/** Astral Fire and Umbral Ice */
	private astralUmbralGauge = this.add(new EnumGauge({
		maximum: 3,
		options: [
			{
				value: ASTRAL_FIRE_HANDLE,
				label: <Trans id="blm.gauge.resource.astral-fire">Astral Fire</Trans>,
				color: FIRE_COLOR.fade(STANCE_FADE),
				tooltipHideWhenEmpty: true,
			},
			{
				value: UMBRAL_ICE_HANDLE,
				label: <Trans id="blm.gauge.resource.umbral-ice">Umbral Ice</Trans>,
				color: ICE_COLOR.fade(STANCE_FADE),
				tooltipHideWhenEmpty: true,
			},
		],
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.astral-umbral">Astral Fire and<br></br>Umbral Ice</Trans>,
			order: 1,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			height: DEFAULT_ROW_HEIGHT * 4 / 5,
		},
	}))

	private astralFireTimer = this.add(new TimerGauge({
		maximum: ASTRAL_UMBRAL_DURATION,
		onExpiration: this.onAstralUmbralTimeout.bind(this),
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.astral-timer">Astral Fire Timer</Trans>,
			color: FIRE_COLOR.fade(TIMER_FADE),
			tooltipHideWhenEmpty: true,
		},
	}))
	private umbralIceTimer = this.add(new TimerGauge({
		maximum: ASTRAL_UMBRAL_DURATION,
		onExpiration: this.onAstralUmbralTimeout.bind(this),
		graph: {
			handle: ASTRAL_UMBRAL_HANDLE,
			label: <Trans id="blm.gauge.resource.umbral-timer">Umbral Ice Timer</Trans>,
			color: ICE_COLOR.fade(TIMER_FADE),
			tooltipHideWhenEmpty: true,
		},
	}))

	/** Astral Soul */
	private astralSoulGauge = this.add(new CounterGauge({
		maximum: ASTRAL_SOUL_MAX_STACKS,
		graph: {
			label: <Trans id="blm.gauge.resource.astral-soul">Astral Soul</Trans>,
			color: FIRE_COLOR.fade(GAUGE_FADE),
			collapse: false,
			height: DEFAULT_ROW_HEIGHT / 2,
		},
	}))

	/** Umbral Hearts */
	private umbralHeartsGauge = this.add(new CounterGauge({
		maximum: UMBRAL_HEARTS_MAX_STACKS,
		graph: {
			label: <Trans id="blm.gauge.resource.umbral-hearts">Umbral Hearts</Trans>,
			color: ICE_COLOR.fade(GAUGE_FADE),
			collapse: false,
			height: DEFAULT_ROW_HEIGHT / 2,
		},
	}))

	/** Paradox */
	private paradoxGauge = this.add(new CounterGauge({
		maximum: PARADOX_MAX_STACKS,
		graph: {
			label: <Trans id="blm.gauge.resource.paradox">Paradox</Trans>,
			color: FIRE_COLOR.fade(GAUGE_FADE),
			collapse: false,
			height: DEFAULT_ROW_HEIGHT / 2,
		},
		correctHistory: true,
	}))

	/** Polyglot */
	private polyglotGauge = this.add(new CounterGauge({
		maximum: POLYGLOT_MAX_STACKS,
		graph: {
			handle: POLYGLOT_HANDLE,
			label: POLYGLOT_LABEL,
			color: POLYGLOT_COLOR.fade(GAUGE_FADE),
			order: 2,
			collapse: true,
			forceCollapsed: true,
			height: DEFAULT_ROW_HEIGHT / 2,
		},
		correctHistory: true,
	}))
	private polyglotTimer = this.add(new TimerGauge({
		maximum: POLYGLOT_DURATION_REQUIRED,
		onExpiration: this.onPolyglotTimerComplete.bind(this),
		graph: {
			handle: POLYGLOT_HANDLE,
			label: <Trans id="blm.gauge.resource.polyglot-timer">Polyglot Timer</Trans>,
			color: POLYGLOT_COLOR.fade(TIMER_FADE),
			tooltipHideWhenEmpty: true,
		},
	}))

	private previousGaugeState: BLMGaugeState = this.getGaugeState(this.parser.pull.timestamp)

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		// The action event is sufficient for actions that don't need to do damage to affect gauge state (ie. Transpose, Enochian, Umbral Soul)
		// Foul, Xenoglossy, and Paradox also fall into this category since they consume their gauge markers on execution
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(AFFECTS_GAUGE_ON_CAST)), this.onCast)

		// The rest of the fire and ice spells must do damage in order to affect gauge state, so hook that event instead.
		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseActionId(this.affectsGaugeOnDamage)), this.onCast)

		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Retrieves the gauge state at the specified epoch timestamp
	 * @param timestamp The epoch timestamp to get the gauge state at, defaults to parser.currentEpochTimestamp
	 * @returns The BLMGaugeState object for this timestamp
	*/
	public getGaugeState(timestamp: number = this.parser.currentEpochTimestamp): BLMGaugeState {
		const astralFire = this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE, timestamp)
		const umbralIce = this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE, timestamp)
		return {
			astralFire,
			umbralIce,
			umbralHearts: this.umbralHeartsGauge.getValueAt(timestamp),
			polyglot: this.polyglotGauge.getValueAt(timestamp),
			enochian: astralFire > 0 || umbralIce > 0,
			paradox: this.paradoxGauge.getValueAt(timestamp),
			astralSoul: this.astralSoulGauge.getValueAt(timestamp),
		}
	}

	//#region onCast and gauge state modification
	private onCast(event: Events['damage'] | Events['action']) {
		let abilityId
		if ('cause' in event && 'action' in event.cause) {
			abilityId = event.cause.action
		} else if ('action' in event) {
			abilityId = event.action
		}

		// If we couldn't figure out what ability this is (somehow wound up here because of a DoT?), bail
		if (abilityId == null) { return }

		// Bail out if the event didn't do damage and the action needs to in order to affect gauge state
		if (this.affectsGaugeOnDamage.includes(abilityId) && event.type === 'damage' && !isSuccessfulHit(event)) { return }

		switch (abilityId) {
		case this.data.actions.BLIZZARD_I.id:
			this.onGainUmbralIceStacks(1)
			break
		case this.data.actions.BLIZZARD_II.id:
		case this.data.actions.HIGH_BLIZZARD_II.id:
		case this.data.actions.BLIZZARD_III.id:
			this.onGainUmbralIceStacks(ASTRAL_UMBRAL_MAX_STACKS, false)
			break
		case this.data.actions.FREEZE.id:
		case this.data.actions.BLIZZARD_IV.id:
			if (this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) === 0) {
				this.onGainUmbralIceStacks(1, false)
			}
			this.umbralHeartsGauge.set(UMBRAL_HEARTS_MAX_STACKS)
			this.addEvent()
			break
		case this.data.actions.UMBRAL_SOUL.id:
			this.onGainUmbralIceStacks(1)
			this.tryGainUmbralHearts(1)
			// Patch 7.05 updated Umbral Soul such that it pauses the Umbral Ice timer, but the Polyglot timer keeps rolling
			if (!this.parser.patch.before('7.05')) {
				this.umbralIceTimer.pause()
			}
			break
		case this.data.actions.FIRE_I.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(1)
			break
		case this.data.actions.FIRE_II.id:
		case this.data.actions.HIGH_FIRE_II.id:
		case this.data.actions.FIRE_III.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(ASTRAL_UMBRAL_MAX_STACKS, false)
			break
		case this.data.actions.FIRE_IV.id:
			if (this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) === 0) {
				this.onGainAstralFireStacks(1, false)
			}
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralSoul(1)
			break
		case this.data.actions.DESPAIR.id:
			this.onGainAstralFireStacks(ASTRAL_UMBRAL_MAX_STACKS, false)
			break
		case this.data.actions.FLARE.id:
			this.tryConsumeUmbralHearts(FLARE_MAX_HEART_CONSUMPTION, true)
			this.onGainAstralFireStacks(ASTRAL_UMBRAL_MAX_STACKS, false)
			this.onGainAstralSoul(FLARE_SOUL_GENERATION)
			break
		case this.data.actions.XENOGLOSSY.id:
		case this.data.actions.FOUL.id:
			this.onConsumePolyglot()
			break
		case this.data.actions.TRANSPOSE.id:
			this.onTransposeStacks()
			break
		case this.data.actions.PARADOX.id:
			this.handleParadox(event)
			break
		case this.data.actions.AMPLIFIER.id:
			this.onGeneratePolyglot()
			break
		case this.data.actions.FLARE_STAR.id:
			this.astralSoulGauge.reset()
			break
		case this.data.actions.MANAFONT.id:
			this.onGainAstralFireStacks(ASTRAL_UMBRAL_MAX_STACKS, false)
			this.gainUmbralHearts(UMBRAL_HEARTS_MAX_STACKS)
			this.onGainParadox()
			break
		}
	}

	private addEvent() {
		if (this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) !== 0 && this.astralFireTimer.expired) {
			this.astralFireTimer.start()
		}
		if (this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) !== 0 && this.umbralIceTimer.expired) {
			this.umbralIceTimer.start()
		}
		if ((!this.astralFireTimer.expired || !this.umbralIceTimer.expired) && this.polyglotTimer.expired) {
			this.polyglotTimer.start()
		}

		if (this.gaugeValuesChanged(this.previousGaugeState)) {
			this.tryGainParadox(this.previousGaugeState)
			this.updateCastTimes(this.previousGaugeState)
			this.previousGaugeState = this.getGaugeState(this.parser.currentEpochTimestamp)

			// Queue event to tell other analysers about the change
			this.parser.queueEvent({
				type: 'blmgauge',
				timestamp: this.parser.currentEpochTimestamp,
				gaugeState: {...this.previousGaugeState},
			})
		}
	}

	private gaugeValuesChanged(lastGaugeState: BLMGaugeState) {
		if (lastGaugeState.astralFire !== this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) ||
			lastGaugeState.umbralIce !== this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) ||
			lastGaugeState.umbralHearts !== this.umbralHeartsGauge.value ||
			lastGaugeState.polyglot !== this.polyglotGauge.value ||
			lastGaugeState.paradox !== this.paradoxGauge.value
		) {
			return true
		}
		return false
	}

	private updateCastTimes(lastGaugeState: BLMGaugeState): void {
		const lastAstralFire = lastGaugeState.astralFire
		const lastUmbralIce = lastGaugeState.umbralIce

		// If we have gained max AF, set Blizzard spells to be fast
		if (lastAstralFire !== ASTRAL_UMBRAL_MAX_STACKS && this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) === ASTRAL_UMBRAL_MAX_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = this.castTime.setPercentageAdjustment(this.iceSpellIds, CAPPED_ASTRAL_UMBRAL_CAST_SCALAR)
		}
		// If we have gained max UI, set Fire spells to be fast
		if (lastUmbralIce !== ASTRAL_UMBRAL_MAX_STACKS && this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) === ASTRAL_UMBRAL_MAX_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = this.castTime.setPercentageAdjustment(this.fireSpellIds, CAPPED_ASTRAL_UMBRAL_CAST_SCALAR)
		}
		// If our current gauge state doesn't have either max AF or max UI, drop the cast time adjustment entirely
		if (this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) !== ASTRAL_UMBRAL_MAX_STACKS && this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) !== ASTRAL_UMBRAL_MAX_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = null
		}
	}

	private tryGainParadox(lastGaugeState: BLMGaugeState) {
		// We gain Paradox when swapping to Astral Fire with max UI stacks and max hearts
		// Patch 7.05 brought back gaining Paradox when switching to Umbral Ice with max AF stacks
		if ((lastGaugeState.umbralIce === ASTRAL_UMBRAL_MAX_STACKS && this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) > 0 && this.umbralHeartsGauge.capped) ||
			(lastGaugeState.astralFire === ASTRAL_UMBRAL_MAX_STACKS && this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) > 0 && !this.parser.patch.before('7.05'))) {

			this.onGainParadox()
		}
	}

	private onGainParadox() {
		if (!this.paradoxGauge.empty) {
			this.gaugeErrors.push({timestamp: this.parser.currentEpochTimestamp, error: GAUGE_ERROR_TYPE.OVERWROTE_PARADOX})
		}

		this.paradoxGauge.generate(1)
	}
	//#endregion

	//#region Astral Fire and Umbral Ice
	private onAstralUmbralTimeout(_args: TimestampHookArguments) {
		this.onAstralUmbralEnd(true)
	}

	private onAstralUmbralEnd(flagIssues: boolean) {
		this.astralFireTimer.reset()
		this.umbralIceTimer.reset()

		this.astralUmbralGauge.reset()

		this.onEnochianTimeout(flagIssues)
	}

	private onGainAstralFireStacks(stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) > 0 && dropsElementOnSwap) {
			this.onAstralUmbralEnd(true)
		} else {
			this.umbralIceTimer.reset()
			this.astralUmbralGauge.clear(UMBRAL_ICE_HANDLE)

			this.astralFireTimer.start()
			this.astralUmbralGauge.generate(ASTRAL_FIRE_HANDLE, stackCount)

			this.addEvent()
		}
	}

	private onGainUmbralIceStacks(stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) > 0 && dropsElementOnSwap) {
			this.onAstralUmbralEnd(true)
		} else {
			this.astralFireTimer.reset()
			this.astralUmbralGauge.clear(ASTRAL_FIRE_HANDLE)

			this.umbralIceTimer.start()
			this.astralUmbralGauge.generate(UMBRAL_ICE_HANDLE, stackCount)

			this.paradoxGauge.reset()
			this.astralSoulGauge.reset()

			this.addEvent()
		}
	}

	private onTransposeStacks() {
		// If we're in neither stance, Transpose is a no-op
		if (this.astralUmbralGauge.empty) { return }

		// If we're currently in Fire, we're swapping to Ice
		if (this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) > 0) {
			this.onGainUmbralIceStacks(1, false)
		} else { // Otherwise, we're swapping to fire
			this.onGainAstralFireStacks(1, false)
		}

		this.addEvent()
	}
	//#endregion

	//#region Umbral Hearts
	private tryGainUmbralHearts(count: number) {
		if (this.astralUmbralGauge.getCountAt(UMBRAL_ICE_HANDLE) === 0) { return }

		this.gainUmbralHearts(count)
	}

	private gainUmbralHearts(count: number) {
		this.umbralHeartsGauge.generate(count)

		this.addEvent()
	}

	private tryConsumeUmbralHearts(count:  number, force: boolean = false) {
		if (this.umbralHeartsGauge.empty || (this.astralUmbralGauge.getCountAt(ASTRAL_FIRE_HANDLE) === 0 && !force)) { return }

		this.umbralHeartsGauge.spend(count)

		this.addEvent()
	}
	//#endregion

	//#region Astral Soul
	private onGainAstralSoul(count: number) {
		this.astralSoulGauge.generate(count)
	}
	//#endregion

	//#region Polyglot
	private onEnochianTimeout(flagIssues: boolean = true) {
		if (this.polyglotTimer.active && flagIssues) {
			this.droppedEnoTimestamps.push(this.parser.currentEpochTimestamp)
		}

		this.polyglotTimer.reset()

		this.umbralHeartsGauge.reset()

		this.astralSoulGauge.reset()

		this.addEvent()
	}

	private onPolyglotTimerComplete() {
		this.polyglotTimer.refresh()

		this.onGeneratePolyglot()
	}

	private onGeneratePolyglot() {
		// Can't just rely on CounterGauge.overCap since there's some weird timing things we have to account for
		if (this.polyglotGauge.capped) {
			this.gaugeErrors.push({timestamp: this.parser.currentEpochTimestamp, error: GAUGE_ERROR_TYPE.OVERWROTE_POLYGLOT})
		}

		this.polyglotGauge.generate(1)

		this.addEvent()
	}

	private onConsumePolyglot() {
		// Safety to catch ordering issues where Foul/Xenoglossy is used late enough to trigger our overwrite check but happens before Poly actually overwrites
		if (this.polyglotGauge.empty && this.gaugeErrors.length > 0) {
			const lastPolyglotOverwriteIndex = _.findLastIndex(this.gaugeErrors, errorEvent => errorEvent.error === GAUGE_ERROR_TYPE.OVERWROTE_POLYGLOT)
			if (lastPolyglotOverwriteIndex !== -1) {
				this.gaugeErrors.splice(lastPolyglotOverwriteIndex, 1)
			}
		}

		this.polyglotGauge.spend(1)

		this.addEvent()
	}

	private countLostPolyglots(time: number) {
		return Math.floor(time / POLYGLOT_DURATION_REQUIRED)
	}
	//#endregion

	/**
	 * Handles the effects of each kind of event for Paradox:
	 * - action: Paradox gauge is spent when the action is executed, whether it does damage or not
	 * - damage: Paradox refreshes the active AF/UI timer when it registers a successful damage event
	 * @param event The Paradox event
	 */
	private handleParadox(event: Events['action'] | Events['damage']) {
		if (event.type === 'action') {
			this.paradoxGauge.spend(1)
		} else if (event.type === 'damage') {
			// We checked isSuccessfulHit back in onCast, so we don't need to check it again here
			// Add a stack for whichever timer isn't expired
			// Because it was physically impossible to cast UI Paradox before patch 7.05, we don't need an extra patch level check here
			if (!this.umbralIceTimer.expired) {
				this.onGainUmbralIceStacks(1)
			}
			if (!this.astralFireTimer.expired) {
				this.onGainAstralFireStacks(1)
			}
		}
	}

	override onDeath() {
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this.onAstralUmbralEnd(false)
		this.paradoxGauge.reset()
		this.polyglotGauge.reset()
	}

	private onComplete() {
		const fightStartLeniency = this.parser.pull.timestamp + this.data.actions.FIRE_IV.castTime // Give the player a bit of time at the start to get Enochian up. Using F4's cast time as a proxy for this
		const forceDropUtaWindows = this.unableToAct.getWindows().filter(uta => Math.max(0, uta.end - uta.start) >= ASTRAL_UMBRAL_DURATION)
		const forceDropForgive = this.data.actions.BLIZZARD_III.castTime + 1000 // Allow a Blizzard III cast time's worth of time (plus a second's worth of jitter) to get Enochian back up after a UTA
		const polyGlotExpirationTime = this.polyglotTimer.getExpirationTime(fightStartLeniency, this.parser.currentEpochTimestamp, forceDropUtaWindows, forceDropForgive)
		const lostPolyglot = this.countLostPolyglots(polyGlotExpirationTime)

		// Find out how many of the enochian drops ocurred during times where the player could not act for longer than the AF/UI buff timer. If they could act, they could've kept it going, so warn about those.
		const droppedEno = this.droppedEnoTimestamps.filter(drop =>
			this.unableToAct
				.getWindows({
					start: drop,
					end: drop,
				})
				.filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION)
				.length === 0
		).length
		if (droppedEno > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FOUL.icon,
				content: <Trans id="blm.gauge.suggestions.dropped-enochian.content">
					Dropping Astral Fire or Umbral Ice may lead to lost <DataLink action="XENOGLOSSY"/> or <DataLink action="FOUL"/> casts.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.gauge.suggestions.dropped-enochian.why">
					Astral Fire or Umbral Ice was dropped <Plural value={droppedEno} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (lostPolyglot > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.lost-polyglot.content">
					You lost Polyglot due to dropped Astral Fire or Umbral Ice. <DataLink action="XENOGLOSSY"/> and <DataLink action="FOUL"/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.lost-polyglot.why">
					<Plural value={lostPolyglot} one="# Polyglot stack was" other="# Polyglot stacks were"/> lost.
				</Trans>,
			}))
		}

		const polyglotOverwriteCount = this.gaugeErrors.filter(errorEvent => errorEvent.error === GAUGE_ERROR_TYPE.OVERWROTE_POLYGLOT).length
		if (polyglotOverwriteCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-polyglot.content">
					You overwrote Polyglot due to not casting <DataLink action="XENOGLOSSY"/> or <DataLink action="FOUL"/> for 30s after gaining a second stack. <DataLink action="XENOGLOSSY"/> and <DataLink action="FOUL"/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.overwritten-polyglot.why">
					<DataLink showIcon={false} action="XENOGLOSSY"/> got overwritten <Plural value={polyglotOverwriteCount} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (this.paradoxGauge.overCap > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.PARADOX.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-paradox.content">
					You overwrote <DataLink action="PARADOX"/> by generating a new marker without using the previous one. <DataLink showIcon={false} action="PARADOX"/> is a strong spell, and guarantees you a free <DataLink showIcon={false} status="FIRESTARTER" /> when cast under Astral Fire, so be sure to use it.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gage.suggestions.overwritten-paradox.why">
					<DataLink showIcon={false} action="PARADOX"/> got overwritten <Plural value={this.paradoxGauge.overCap} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}

	private errorMessage(errorEvent: BLMGaugeError) {
		if (errorEvent.error === GAUGE_ERROR_TYPE.OVERWROTE_POLYGLOT) {
			return <Trans id="blm.gauge.error.polyglot"><DataLink action="XENOGLOSSY"/> / <DataLink action="FOUL"/></Trans>
		}

		if (errorEvent.error === GAUGE_ERROR_TYPE.OVERWROTE_PARADOX) {
			return <Trans id="blm.gauge.error.paradox"><DataLink action="PARADOX"/></Trans>
		}

		return <Trans id="blm.gauge.error.unknown">Unknown error</Trans>
	}

	override output() {
		if (this.gaugeErrors.length === 0) { return false }

		return (
			<Fragment>
				<Message>
					<Trans id="blm.gauge.error.content">
						Reaching Umbral Ice III and gaining 3 Umbral Hearts then swapping to the opposite element generates a <DataLink action="PARADOX"/> marker.<br/>
						Using <DataLink action="MANAFONT" />, or reaching Astral Fire III then swapping to the opposite element also generates a <DataLink action="PARADOX" /> marker.<br/>
						Maintaining Enochian for 30 seconds or using <DataLink action="AMPLIFIER"/> generates a Polyglot charge, allowing
						the casting of <DataLink action="XENOGLOSSY"/> or <DataLink action="FOUL"/>. You can have up to <Plural value={POLYGLOT_MAX_STACKS} one="# Polyglot charge" other="# Polyglot charges"/>.<br/>
						This module displays when these gauge effects were overwritten.
					</Trans>
				</Message>
				<Table collapsing unstackable compact="very">
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell><Trans id="blm.gauge.header.time">Time</Trans></Table.HeaderCell>
							<Table.HeaderCell><Trans id="blm.gauge.header.event">Overwrote</Trans></Table.HeaderCell>
							<Table.HeaderCell></Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{this.gaugeErrors.map(errorEvent => {
							return <Table.Row key={errorEvent.timestamp}>
								<Table.Cell>{this.parser.formatEpochTimestamp(errorEvent.timestamp)}</Table.Cell>
								<Table.Cell>{this.errorMessage(errorEvent)}</Table.Cell>
								<Table.Cell>
									<Button onClick={() =>
										this.timeline.show(errorEvent.timestamp - this.parser.pull.timestamp, errorEvent.timestamp - this.parser.pull.timestamp)}>
										<Trans id="blm.gauge.timelinelink-button">Jump to Timeline</Trans>
									</Button>
								</Table.Cell>
							</Table.Row>
						})}
					</Table.Body>
				</Table>
			</Fragment>
		)
	}
}

