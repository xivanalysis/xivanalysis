import {t} from '@lingui/macro'

import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'

import {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'

import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FORMS} from './Forms'

// GL stack caps.
export const MAX_STACKS = 3
export const MAX_FASTER = 4

// Actions that grant stacks.
const GL_GRANTERS: number[] = [
	ACTIONS.DEMOLISH.id,
	ACTIONS.ROCKBREAKER.id,
	ACTIONS.SNAP_PUNCH.id,
]

// Actions that refresh the timer without granting stacks.
const GL_REFRESHERS: number[] = [
	// kinda weird, only when going Coeurl->Opo-Opo and you need at least one stack
	ACTIONS.FORM_SHIFT.id,
	ACTIONS.SIX_SIDED_STAR.id,
]

// The duration for timeouts
const GL_TIMEOUT_MILLIS = STATUSES.GREASED_LIGHTNING.duration * 1000

export default class Gauge extends CoreGauge {
	static handle = 'greasedLightning'
	static title = t('mnk.gauge.title')`Greased Lightning`
	static displayOrder = DISPLAY_ORDER.GREASED_LIGHTNING

	@dependency private combatants!: Combatants

	private _stacks = this.add(new CounterGauge({
		maximum: MAX_STACKS,
		chart: {label: 'Stacks', color: JOBS.MONK.colour},
	}))

	private _timer = this.add(new TimerGauge({
		maximum: GL_TIMEOUT_MILLIS,
		chart: {label: 'Duration', color: JOBS.PALADIN.colour},
		onExpiration: () => this._stacks.reset(),
	}))

	protected init(): void {
		super.init()

		this.addEventHook('applybuff', {to: 'player', abilityId: STATUSES.FISTS_OF_WIND.id}, this.goFast)
		this.addEventHook('removebuff', {to: 'player', abilityId: STATUSES.FISTS_OF_WIND.id}, this.slowDown)

		this.addEventHook('cast', {by: 'player', abilityId: GL_GRANTERS}, this.onGain)
		this.addEventHook('cast', {by: 'player', abilityId: GL_REFRESHERS}, this.onRefresh)
		this.addEventHook('applybuff', {to: 'player', abilityId: STATUSES.EARTHS_REPLY.id}, this.onRefresh)

		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.TORNADO_KICK.id}, this.onDrop)

		this.addEventHook('refreshbuff', {by: 'player', abilityId: FORMS}, this.onFleek)

		this.addEventHook('applybuff', {to: 'player', abilityId: STATUSES.ANATMAN.id}, this.becomeAntman)
		this.addEventHook('removebuff', {to: 'player', abilityId: STATUSES.ANATMAN.id}, this.becomeMortal)
	}

	public get stacks(): number {
		return this._stacks.value
	}

	public get timer(): number {
		return this._timer.remaining
	}

	public getStacksAt(timestamp: number): number {
		return this._stacks.getValueAt(timestamp)
	}

	private goFast(): void {
		this._stacks.setMaximum(MAX_FASTER)
	}

	private slowDown(): void {
		this._stacks.setMaximum(MAX_STACKS)
	}

	private onGain(): void {
		this._stacks.modify(1)
		this._timer.start()
	}

	// If they're using Form Shift but don't have Coeurl Form, it does nothing
	private onRefresh(event: BuffEvent | CastEvent): void {
		if (event.ability.guid === ACTIONS.FORM_SHIFT.id && !this.combatants.selected.hasStatus(STATUSES.COEURL_FORM.id)) {
			return
		}

		this._timer.refresh()
	}

	private onDrop(): void {
		this._stacks.reset()
		this._timer.reset()
	}

	// Anatman status ticks indicate when the gauge ticks too, great meme
	// It works even if you have no stacks, so we sanity-check the status is active.
	private onFleek(): void {
		if (this.combatants.selected.hasStatus(STATUSES.ANATMAN.id)) {
			this._stacks.modify(1)
			this._timer.set(GL_TIMEOUT_MILLIS, true)
		}
	}

	// Anatman doesn't immediately refresh which requires a tick, but it does freeze.
	private becomeAntman(): void {
		this._timer.pause()
	}

	// Gauge restarts
	private becomeMortal(): void {
		this._timer.resume()
	}
}
