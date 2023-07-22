import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {EventHook, TimestampHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge} from 'parser/core/modules/Gauge'
import {SetGauge} from 'parser/core/modules/Gauge/SetGauge'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {BLITZ_ACTIONS, COEURL_ACTIONS, FORM_ACTIONS, OPO_OPO_ACTIONS, RAPTOR_ACTIONS} from './constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {fillActions} from './utilities'

const BEAST_GAUGE_HANDLE = 'beastgauge'
const NADI_GAUGE_HANDLE = 'nadigauge'
const LUNAR_VALUE = 'lunar'
const SOLAR_VALUE = 'solar'

const BEAST_GAUGE_TIMEOUT_MILLIS = 20000

const SUGGESTION_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

// Naive ding on bad actions, technically some AoE or normal GCD actions are bad too, adjust if people actually care
const PB_BAD_ACTIONS: ActionKey[] = [
	'FORM_SHIFT',
	'ANATMAN',
]

interface Balance {
	bads: number
	stacks: number // this is the number of stacks the window began with (may be less than the max for dungeons/24mans with a carried-over PB)
	used: number
	start: number
}

const OPO_GAUGE_COLOR = Color('#a256dc')
const RAPTOR_GAUGE_COLOR = Color('#57b39a')
const COEURL_GAUGE_COLOR = Color('#d7548e')
const LUNAR_NADI_COLOR = Color('#8a57c4')
const SOLAR_NADI_COLOR = Color('#e7dbd3')

const CHAKRA_TO_BLITZ = 3

export class PerfectBalance extends Gauge {
	static override debug = false
	static override handle = 'perfectBalance'
	static override title = t('mnk.pb.title')`Perfect Balance`
	static override displayOrder = DISPLAY_ORDER.PERFECT_BALANCE

	@dependency private suggestions!: Suggestions

	private badActions: Array<Action['id']> = []
	private formActions: Array<Action['id']> = []
	private opoActions: Array<Action['id']> = []
	private raptorActions: Array<Action['id']> = []
	private coeurlActions: Array<Action['id']> = []
	private blitzActions: Array<Action['id']> = []

	private current: Balance | undefined
	private history: Balance[] = []

	private perfectHook?: EventHook<Events['action']>
	private beastTimeoutHook?: TimestampHook

	private opoBeastGauge = this.add(new CounterGauge({
		maximum: CHAKRA_TO_BLITZ,
		initialValue: 0,
		graph: {
			handle: BEAST_GAUGE_HANDLE,
			label: <Trans id="mnk.gauge.resource.beast.opo">Opo-opo</Trans>,
			color: OPO_GAUGE_COLOR.fade(GAUGE_FADE),
		},
	}))
	private raptorBeastGauge = this.add(new CounterGauge({
		maximum: CHAKRA_TO_BLITZ,
		initialValue: 0,
		graph: {
			handle: BEAST_GAUGE_HANDLE,
			label: <Trans id="mnk.gauge.resource.beast.raptor">Raptor</Trans>,
			color: RAPTOR_GAUGE_COLOR.fade(GAUGE_FADE),
		},
	}))
	private coeurlBeastGauge = this.add(new CounterGauge({
		maximum: CHAKRA_TO_BLITZ,
		initialValue: 0,
		graph: {
			handle: BEAST_GAUGE_HANDLE,
			label: <Trans id="mnk.gauge.resource.beast.coeurl">Coeurl</Trans>,
			color: COEURL_GAUGE_COLOR.fade(GAUGE_FADE),
		},
	}))

	private nadiGauge = this.add(new SetGauge({
		options: [
			{
				value: LUNAR_VALUE,
				label: <Trans id="mnk.gauge.resource.nadi.lunar">Lunar Nadi</Trans>,
				color: LUNAR_NADI_COLOR.fade(GAUGE_FADE),
			},
			{
				value: SOLAR_VALUE,
				label: <Trans id="mnk.gauge.resource.nadi.solar">Solar Nadi</Trans>,
				color: SOLAR_NADI_COLOR.fade(GAUGE_FADE),
			},
		],
		graph: {
			handle: NADI_GAUGE_HANDLE,
			label: <Trans id="mnk.gauge.resource.nadi">Nadi Gauge</Trans>,
			order: 2,
		},
	}))

	override initialise() {
		super.initialise()

		this.badActions = fillActions(PB_BAD_ACTIONS, this.data)
		this.formActions = fillActions(FORM_ACTIONS, this.data)
		this.opoActions = fillActions(OPO_OPO_ACTIONS, this.data)
		this.raptorActions = fillActions(RAPTOR_ACTIONS, this.data)
		this.coeurlActions = fillActions(COEURL_ACTIONS, this.data)
		this.blitzActions = fillActions(BLITZ_ACTIONS, this.data)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.PERFECT_BALANCE.id), this.onStacc)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.PERFECT_BALANCE.id), this.onDrop)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.blitzActions)), this.onBlitz)

		this.addEventHook('complete', this.onComplete)

		this.resourceGraphs.addDataGroup({
			handle: BEAST_GAUGE_HANDLE,
			label: <Trans id="mnk.gauge.resource.beast.chakra">Beast Chakra</Trans>,
			collapse: true,
			forceCollapsed: true,
			stacking: true,
		})
	}

	// Determine if perfect balance is active at the specified timestamp. It's active if:
	// Any of the chakra gauges have values in them, or
	// There is a history window that contains the specified timestamp
	public inBalance(timestamp: number): boolean {
		const latestHistory = this.history.find(entry => entry.start <= timestamp && entry.start + this.data.statuses.PERFECT_BALANCE.duration < timestamp)
		return this.opoBeastGauge.getValueAt(timestamp) > 0 || this.raptorBeastGauge.getValueAt(timestamp) > 0 || this.coeurlBeastGauge.getValueAt(timestamp) > 0 || latestHistory != null
	}

	public blitzReady(timestamp: number): boolean {
		return (this.opoBeastGauge.getValueAt(timestamp) + this.raptorBeastGauge.getValueAt(timestamp) + this.coeurlBeastGauge.getValueAt(timestamp)) >= CHAKRA_TO_BLITZ
	}

	private onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		if (action == null || !(action.onGcd ?? false)) { return }

		if (this.current) {
			// Flag any bad GCDs
			if (this.badActions.includes(action.id)) {
				this.current.bads++
			} else {
				this.current.used++
			}

			// Make sure we don't record additional gauge generation if the player doesn't immediately blitz after using their PB stacks
			if (this.current.used <= this.current.start) {
				if (this.opoActions.includes(action.id)) {
					this.opoBeastGauge.generate(1)
				}
				if (this.raptorActions.includes(action.id)) {
					this.raptorBeastGauge.generate(1)
				}
				if (this.coeurlActions.includes(action.id)) {
					this.coeurlBeastGauge.generate(1)
				}
			}
		}
	}

	private onBlitz(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		if (action == null || !(action.onGcd ?? false)) { return }

		// The blitz action closes the window if it wasn't already
		this.stopAndSave()

		switch (action.id) {
		case this.data.actions.ELIXIR_FIELD.id:
			this.nadiGauge.generate(LUNAR_VALUE)
			break
		case this.data.actions.RISING_PHOENIX.id:
			this.nadiGauge.generate(SOLAR_VALUE)
			break
		case this.data.actions.PHANTOM_RUSH.id:
			this.nadiGauge.reset()
			break
		case this.data.actions.CELESTIAL_REVOLUTION.id:
			if (!this.nadiGauge.getStateAt(LUNAR_VALUE)) {
				this.nadiGauge.generate(LUNAR_VALUE)
			} else {
				this.nadiGauge.generate(SOLAR_VALUE)
			}
		}
	}

	private onStacc(event: Events['statusApply']): void {
		// Bail early if no stacks
		if (event.data == null) { return }

		// New window who dis - check for new window before updating just in case
		// If we didn't have a window already, go ahead and create one anyways since it probably means they began the fight with a partially-used PB (24-man or dungeon)
		if (event.data === this.data.statuses.PERFECT_BALANCE.stacksApplied || this.current == null) {
			this.current = {bads: 0, stacks: event.data, used: 0, start: event.timestamp}

			// Create the hook to check GCDs in PB
			this.perfectHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action')
					.action(oneOf([...this.badActions, ...this.formActions])),
				this.onCast,
			)

			return
		}

		// We should have returned by now, so debug if not
		this.debug('New PB window with incorrect initial stacks')
	}

	private onDrop(): void {
		const statusDuration = this.parser.currentEpochTimestamp - (this.current?.start ?? this.parser.pull.timestamp)
		// If Perfect Balance fell off because they took too long, go ahead and close the window now, they won't be able to blitz
		if (statusDuration === this.data.statuses.PERFECT_BALANCE.duration) {
			this.stopAndSave()
		} else {
			// Otherwise, set a timestamp hook to close the window if they also take too long to use their blitz action
			this.beastTimeoutHook = this.addTimestampHook(this.parser.currentEpochTimestamp + BEAST_GAUGE_TIMEOUT_MILLIS, this.stopAndSave)
		}
	}

	private stopAndSave(): void {
		// If it's not current for some reason, something is wrong anyway
		if (this.current != null) {
			this.history.push(this.current)

			// Remove the perfect balance event hook so we don't keep trying to generate
			if (this.perfectHook != null) {
				this.removeEventHook(this.perfectHook)
				this.perfectHook = undefined
			}
			if (this.beastTimeoutHook != null) {
				this.removeTimestampHook(this.beastTimeoutHook)
				this.beastTimeoutHook = undefined
			}
		}

		this.opoBeastGauge.reset()
		this.raptorBeastGauge.reset()
		this.coeurlBeastGauge.reset()
		this.current = undefined
	}

	private onComplete(): void {
		// Close up if PB was active at the end of the fight
		this.stopAndSave()

		// Stacks are hard set instead of being subtracted, so we need to take used from max rather than raw remaining
		const droppedGcds = this.history.reduce((drops, current) => drops + (current.stacks - current.used), 0)
		const badActions = this.history.reduce((bads, current) => bads + current.bads, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			content: <Trans id="mnk.pb.suggestions.stacks.content">
				Try to consume all {this.data.statuses.PERFECT_BALANCE.stacksApplied} stacks during every <DataLink action="PERFECT_BALANCE"/> window.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedGcds,
			why: <Trans id="mnk.pb.suggestions.stacks.why">
				<Plural value={droppedGcds} one="# possible GCD was" other="# possible GCDs were" /> missed during <DataLink status="PERFECT_BALANCE"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			content: <Trans id="mnk.pb.suggestions.badActions.content">
				Using <DataLink action="FORM_SHIFT"/> or <DataLink action="ANATMAN"/> inside of <DataLink status="PERFECT_BALANCE"/> does no damage and does not change your Form.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
			},
			value: badActions,
			why: <Trans id="mnk.pb.suggestions.badActions.why">
				<Plural value={badActions} one="# use of" other="# uses of"/> uses of <DataLink action="FORM_SHIFT"/> or <DataLink action="ANATMAN"/> were used during <DataLink status="PERFECT_BALANCE"/>.
			</Trans>,
		}))

		const nadiOvercap = this.nadiGauge.overcap
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PHANTOM_RUSH.icon,
			content: <Trans id="mnk.pb.suggestions.nadi-overcap.content">
				Generating a Lunar or Solar Nadi while already in possession of that Nadi means fewer uses of <DataLink action="PHANTOM_RUSH" /> over the course of the fight. Try not to overcap either of your Nadis.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: nadiOvercap,
			why: <Trans id="mnk.pb.suggestions.nadi-overcap.why">
				You generated a Nadi while already in possession of that Nadi <Plural value={nadiOvercap} one="# time" other="# times" />.
			</Trans>,
		}))
	}
}
