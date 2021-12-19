import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// you get 2 (two) scales
const MAX_FOCUS = 2
const FMF_PER_CAST = 1
const WWT_COST = 2

// this is like a purple which is close to the color used on the gauge
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const FMF_COLOR = Color.rgb(196, 101, 234).fade(0.25).toString()

const FMF_GENERATORS: ActionKey[] = [
	'RAIDEN_THRUST',
	'DRACONIAN_FURY',
]

// todo:
// - check how this handles situations where drg carried over a fmf stack
export class Gauge extends CoreGauge {
	@dependency private suggestions!: Suggestions

	// this is technically a gauge for Firstminds' Focus which enables wyrmwind thrust
	private fmfGauge = this.add(new CounterGauge({
		maximum: MAX_FOCUS,
		graph: {
			label: <Trans id="drg.gauge.resource.fmf">Firstminds' Focus</Trans>,
			color: FMF_COLOR,
		},
		correctHistory: true,
		deterministic: true,
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(FMF_GENERATORS)), this.onGeneratorCast)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.WYRMWIND_THRUST.id), this.onWwtCast)

		this.addEventHook('complete', this.onComplete)
	}

	private onGeneratorCast() {
		this.fmfGauge.generate(FMF_PER_CAST)
	}

	private onWwtCast() {
		this.fmfGauge.spend(WWT_COST)
	}

	private onComplete() {
		const fmfOvercap = this.fmfGauge.overCap
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.WYRMWIND_THRUST.icon,
			content: <Trans id="drg.gauge.suggestions.overcapped-fmf.content">
				Make sure to use <DataLink action="WYRMWIND_THRUST" /> before <DataLink action="RAIDEN_THRUST" /> or <DataLink action="DRACONIAN_FURY" /> when you already have two stacks of Firstminds' Focus to prevent losing uses of <DataLink action="WYRMWIND_THRUST" /> by overcapping.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: fmfOvercap,
			why: <Trans id="drg.gauge.suggestions.overcapped-fmf.why">
				<Plural value={fmfOvercap} one="# Firstminds' Focus stack" other="# Firstminds' Focus stacks" /> were lost.
			</Trans>,
		}))
	}
}
