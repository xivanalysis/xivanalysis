import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import JOBS from 'data/JOBS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, ActionWindow, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, LimitedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import { History } from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import Gauge from 'parser/jobs/rdm/modules/Gauge'
import {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'
import React, {Fragment} from 'react'
import {isSuccessfulHit} from 'utilities'

type MeleeCombo = {
	events: Array<Events['action']>,
	lastAction: Events['action'],
	finisher: {
		 used: number
	 }
	broken: boolean,
	initialized: boolean,
}

export default class MeleeCombos extends Analyser {
	static override handle = 'mlc'
	static override title = t('rdm.meleecombos.title')`Melee Combos`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private cooldowns!: Cooldowns
	@dependency private actors!: Actors
	@dependency private gauge!: Gauge

	private readonly _finishers = {
		white: this.data.actions.VERHOLY.id,
		black: this.data.actions.VERFLARE.id,
	}
	private readonly _severityWastedFinisher = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	}
	private _manaActions = {
		white: {
			proc: this.data.actions.VERSTONE.id,
			dualcast: this.data.actions.VERAERO.id,
		},
		black: {
			proc: this.data.actions.VERFIRE.id,
			dualcast: this.data.actions.VERTHUNDER.id,
		},
	}
	private readonly _ignoreFinisherProcsManaThreshold = 4
	//4 seconds for 2 GCD minus a 1 second window to activate before finisher
	private readonly _delayAccelerationAvailableThreshold = 4
	private _meleeCombos = new History<MeleeCombo>(() => ({
		  events: [],
		  lastAction: {} as Events['action'],
		 finisher: {
			 used: 0
		 },
		broken: false,
		initialized: false, }))
	private _incorrectFinishers = {
		verholy: 0,
		verflare: 0,
		delay: 0,
	}

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id),
			this.onCast)
		this.addEventHook(
			filter<Event>()
				.type('death')
				.actor(this.parser.actor.id),
			this.onDeath
		)
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		if (action == null) {
			return
		}

		if (action.combo) {
			if (action.combo.start) {
				this.breakComboIfExists(event.timestamp)
				this.startCombo(event)
			} else {
				if (this._meleeCombos.getCurrent() == null) {
					return
				}

				if (action.combo.from) {
					const fromOptions = Array.isArray(action.combo.from) ? action.combo.from : [action.combo.from]
					const current = this._meleeCombos.getCurrent()
					if (current) {
					if (!fromOptions.includes(current.data.lastAction.action ?? 0)) {
						current.data.broken = true
						this.endCombo(event.timestamp)
					} else {
						current.data.events.push(event)
						current.data.lastAction = event
						if (action.combo.end) {
							current.data.finisher.used = event.action
							//this.handleFinisher()
							this.endCombo(event.timestamp)
						}
					}
				}
				}
			}
		}

		if (action.breaksCombo) {
			this.breakComboIfExists(event.timestamp)
		}
	}

	private onDeath(event: Events['death']) {
		this.breakComboIfExists(event.timestamp)
	}

	private startCombo(event: Events['action']) {
		this._meleeCombos.openNew(event.timestamp)
		const current = this._meleeCombos.getCurrent()
		if (current) {
			current.data.events.push(event)
			current.data.lastAction = event
		}
	}

	private breakComboIfExists(timestamp: number) {
		const current = this._meleeCombos.getCurrent()
		if (current) {
			current.data.broken = true
			this.endCombo(timestamp)
		}
	}

	private endCombo(timestamp: number) {
		this._meleeCombos.closeCurrent(timestamp)
	}
}
