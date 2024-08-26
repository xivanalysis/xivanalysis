import {Trans} from '@lingui/react'
import Color from 'color'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {CounterGauge, Gauge} from 'parser/core/modules/Gauge'
import {GAUGE_FADE, ResourceDataGroup} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import React from 'react'
import ACTIONS, {Action} from '../../../../data/ACTIONS'

const MAX_WM_REPERTOIRE = 3
const MAX_AP_REPERTOIRE = 4

const SONG_GAUGE_INFO: {[key: number]: Action | undefined} = {
	0x5: ACTIONS.MAGES_BALLAD,
	0xA: ACTIONS.ARMYS_PAEON,
	0xF: ACTIONS.THE_WANDERERS_MINUET,
	0xC: undefined,
}

const WM_REPERTOIRE_COLOR = Color('#8BB8FF').fade(GAUGE_FADE)
const AP_REPERTOIRE_COLOR = Color('#EDD78B').fade(GAUGE_FADE)

export class Repertoire extends Gauge {
	static override handle = 'repertoire'

	private dataGroup: ResourceDataGroup | undefined
	private wmRepertoireGauge: CounterGauge | undefined
	private apRepertoireGauge: CounterGauge | undefined

	override initialise() {
		super.initialise()
		this.addEventHook(filter<Event>().actor(this.parser.actor.id).type('gaugeUpdate'), this.handleLoggedGauge)
	}
	private handleLoggedGauge(event: Events['gaugeUpdate']) {
		// If we haven't yet noted that this player has gauge update events, set that now
		if (!this.parser.actor.loggedGauge) { this.parser.actor.loggedGauge = true }

		if ('repertoire' in event && event.repertoire != null) {
			this.dataGroup ??= this.resourceGraphs.addDataGroup({
				handle: 'repertoire',
				label: <Trans id="brd.gauge.resource.repertoire">Repertoire</Trans>,
				forceCollapsed: true,
			})

			switch (SONG_GAUGE_INFO[event.song]) {
			case ACTIONS.THE_WANDERERS_MINUET:
				this.wmRepertoireGauge ??= this.add(new CounterGauge({
					maximum: MAX_WM_REPERTOIRE,
					graph: {
						handle: 'repertoire',
						label: <Trans id="brd.gauge.resource.repertoire.wm">Wanderer's Repertoire</Trans>,
						color: WM_REPERTOIRE_COLOR,
					},
				}))

				if (this.wmRepertoireGauge.value !== event.repertoire) {
					this.wmRepertoireGauge.set(event.repertoire)
				}
				if (this.apRepertoireGauge) { this.apRepertoireGauge.reset() }
				break
			case ACTIONS.ARMYS_PAEON:
				this.apRepertoireGauge ??= this.add(new CounterGauge({
					maximum: MAX_AP_REPERTOIRE,
					graph: {
						handle: 'repertoire',
						label: <Trans id="brd.gauge.resource.repertoire.ap">Army's Repertoire</Trans>,
						color: AP_REPERTOIRE_COLOR,
					},
				}))

				if (this.apRepertoireGauge.value !== event.repertoire) {
					this.apRepertoireGauge.set(event.repertoire)
				}
				if (this.wmRepertoireGauge) { this.wmRepertoireGauge.reset() }
				break
			default:
				if (this.wmRepertoireGauge) { this.wmRepertoireGauge.reset() }
				if (this.apRepertoireGauge) { this.apRepertoireGauge.reset() }
			}
		}
	}
}
