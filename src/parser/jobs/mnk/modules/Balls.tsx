import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Gauge} from 'parser/core/modules/Gauge'
import {SetGauge} from 'parser/core/modules/Gauge/SetGauge'
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
	static override handle = 'balls'
	static override title = t('mnk.balls.title')`Fury Gauge`

	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

	private furyGauge = this.add(new SetGauge({
		options: [
			{
				value: 'opo',
				color: OPO_GAUGE_COLOR.fade(GAUGE_FADE),
				label: <Trans id="mnk.balls.opoFury.label">Opo-opo Fury</Trans>,
			},
			{
				value: 'raptor',
				color: RAPTOR_GAUGE_COLOR.fade(GAUGE_FADE),
				label: <Trans id="mnk.balls.raptorFury.label">Raptor Fury</Trans>,
			},
			{
				value: 'coeurl' + 0,
				color: COEURL_GAUGE_COLOR.fade(GAUGE_FADE),
				label: <Trans id="mnk.balls.coeurlFury.label">Coeurl Fury 1</Trans>,
			},
			{
				value: 'coeurl' + 1,
				color: COEURL_GAUGE_COLOR.fade(GAUGE_FADE),
				label: <Trans id="mnk.balls.coeurlFury2.label">Coeurl Fury 2</Trans>,
			},
		],
		graph: {
			handle: 'furyGauge',
			label: <Trans id="mnk.balls.furyGauge.label">Fury Gauge</Trans>,
		},
	}))

	override initialise() {
		super.initialise()

		const gaugeModifiers = fillActions(ST_FORM_ACTIONS, this.data)

		const gaugeModifierFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(oneOf(gaugeModifiers))

		this.addEventHook(gaugeModifierFilter, this.onGaugeModifier)
		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action']) {
		const hasFormless = this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id)
		const hasPerfectBalance = this.actors.current.hasStatus(this.data.statuses.PERFECT_BALANCE.id)
		const hasOpoForm = this.actors.current.hasStatus(this.data.statuses.OPO_OPO_FORM.id)

		switch (event.action) {
		// DK is the only action that can "fail" to generate balls
		case this.data.actions.DRAGON_KICK.id:
			if (hasFormless || hasPerfectBalance || hasOpoForm) {
				this.furyGauge.generate('opo')
			}
			break
		case this.data.actions.BOOTSHINE.id:
		case this.data.actions.LEAPING_OPO.id:
			this.furyGauge.spend('opo')
			break
		case this.data.actions.TWIN_SNAKES.id:
			this.furyGauge.generate('raptor')
			break
		case this.data.actions.TRUE_STRIKE.id:
		case this.data.actions.RISING_RAPTOR.id:
			this.furyGauge.spend('raptor')
			break
		case this.data.actions.DEMOLISH.id:
			this.furyGauge.generate('coeurl' + 0)
			this.furyGauge.generate('coeurl' + 1)
			break
		case this.data.actions.SNAP_PUNCH.id:
		case this.data.actions.POUNCING_COEURL.id:
			this.furyGauge.getStateAt('coeurl' + 1)
				? this.furyGauge.spend('coeurl' + 1)
				: this.furyGauge.spend('coeurl' + 0)
			break
		}
	}

	private onComplete() {
		const overCap = this.furyGauge.overcap

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEMOLISH.icon,
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
