import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge} from 'parser/core/modules/Gauge'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {fillActions} from 'utilities/fillArrays'
import {ST_FORM_ACTIONS} from './constants'

const OPO_GAUGE_COLOR = Color('#a256dc')
const RAPTOR_GAUGE_COLOR = Color('#57b39a')
const COEURL_GAUGE_COLOR = Color('#d7548e')

const OVERCAP_SEVERITY = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export class Balls extends Gauge {
	static override title = t('mnk.balls.title')`Fury Gauge`

	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	private opoFury: CounterGauge | null = null
	private raptorFury: CounterGauge | null = null
	private coeurlFury: CounterGauge | null = null

	override initialise() {
		super.initialise()

		this.resourceGraphs.addDataGroup({
			handle: 'gauges',
			label: <Trans id="mnk.balls.resource-graphs.fury">Fury Gauge</Trans>,
			height: 32,
			collapse: true,
		})

		this.opoFury = this.add(new CounterGauge({
			graph: {
				handle: 'gauges',
				label: <Trans id="mnk.balls.opoFury.label">Opo-opo Fury</Trans>,
				color: OPO_GAUGE_COLOR.fade(GAUGE_FADE),
				collapse: true,
				height: 8,
			},
			maximum: 1,
			initialValue: 0,
		}))

		this.raptorFury = this.add(new CounterGauge({
			graph: {
				handle: 'gauges',
				label: <Trans id="mnk.balls.raptorFury.label">Raptor Fury</Trans>,
				color: RAPTOR_GAUGE_COLOR.fade(GAUGE_FADE),
				collapse: true,
				height: 8,
			},
			maximum: 1,
			initialValue: 0,
		}))

		this.coeurlFury = this.add(new CounterGauge({
			graph: {
				handle: 'gauges',
				label: <Trans id="mnk.balls.coeurlFury.label">Coeurl Fury</Trans>,
				color: COEURL_GAUGE_COLOR.fade(GAUGE_FADE),
				collapse: true,
				height: 16,
			},
			maximum: 2,
			initialValue: 0,
		}))

		const gaugeModifiers = fillActions(ST_FORM_ACTIONS, this.data)

		const gaugeModifierFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(oneOf(gaugeModifiers))

		this.addEventHook(gaugeModifierFilter, this.onGaugeModifier)
		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action']) {
		if (!this.opoFury || !this.raptorFury || !this.coeurlFury) {
			return
		}

		const hasFormless = this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id)
		const hasPerfectBalance = this.actors.current.hasStatus(this.data.statuses.PERFECT_BALANCE.id)
		const hasOpoForm = this.actors.current.hasStatus(this.data.statuses.OPO_OPO_FORM.id)

		switch (event.action) {
		// DK is the only action that can "fail" to generate balls
		case this.data.actions.DRAGON_KICK.id:
			if (hasFormless || hasPerfectBalance || hasOpoForm) {
				this.opoFury.generate(1)
			}
			break
		case this.data.actions.BOOTSHINE.id:
		case this.data.actions.LEAPING_OPO.id:
			this.opoFury.spend(1)
			break
		case this.data.actions.TWIN_SNAKES.id:
			this.raptorFury.generate(1)
			break
		case this.data.actions.TRUE_STRIKE.id:
		case this.data.actions.RISING_RAPTOR.id:
			this.raptorFury.spend(1)
			break
		case this.data.actions.DEMOLISH.id:
			this.coeurlFury.generate(2)
			break
		case this.data.actions.SNAP_PUNCH.id:
		case this.data.actions.POUNCING_COEURL.id:
			this.coeurlFury.spend(1)
			break
		}
	}

	private onComplete() {
		if (!this.opoFury || !this.raptorFury || !this.coeurlFury) {
			return
		}

		const overCap = this.opoFury.overCap + this.raptorFury.overCap + this.coeurlFury.overCap
		// Get the icon for the action that overcapped the most balls
		const dominantOvercapIcon = this.opoFury.overCap > this.raptorFury.overCap
			? this.opoFury.overCap > this.coeurlFury.overCap
				? this.data.actions.BOOTSHINE.icon
				: this.data.actions.LEAPING_OPO.icon
			: this.raptorFury.overCap > this.coeurlFury.overCap
				? this.data.actions.TRUE_STRIKE.icon
				: this.data.actions.RISING_RAPTOR.icon

		this.suggestions.add(new TieredSuggestion({
			icon: dominantOvercapIcon,
			content: <Trans id="mnk.balls.suggestions.overcap.content">
				Try not to overcap your Fury gauge. Use <ActionLink action="LEAPING_OPO" />, <ActionLink action="RISING_RAPTOR" />, and <ActionLink action="POUNCING_COEURL" /> over their alternatives whenever a stack of their respective Fury gauge is available.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: overCap,
			why: <Trans id="mnk.balls.suggestions.overcap.why">
				You lost <Plural value={overCap} one="# stack" other="# stacks" /> of Fury due to overcapping.
			</Trans>,
		}))
	}
}
