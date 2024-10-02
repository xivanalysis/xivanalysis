import {Trans} from '@lingui/react'
import Color from 'color'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {CounterGauge, Gauge} from 'parser/core/modules/Gauge'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import React from 'react'

const MAX_SOUL_VOICE = 100
const SOUL_VOICE_COLOR = Color('#5DBD99').fade(GAUGE_FADE)

export class SoulVoice extends Gauge {
	static override handle = 'soulvoice'
	private soulVoiceGauge: CounterGauge | undefined

	override initialise() {
		super.initialise()
		this.addEventHook(filter<Event>().actor(this.parser.actor.id).type('gaugeUpdate'), this.handleLoggedGauge)
	}
	private handleLoggedGauge(event: Events['gaugeUpdate']) {
		// If we haven't yet noted that this player has gauge update events, set that now
		if (!this.parser.actor.loggedGauge) { this.parser.actor.loggedGauge = true }

		if ('soulVoice' in event && event.soulVoice != null) {
			if (!this.soulVoiceGauge) {
				this.soulVoiceGauge = this.add(new CounterGauge({
					maximum: MAX_SOUL_VOICE,
					graph: {
						handle: 'soulvoice',
						label: <Trans id="brd.gauge.resource.soulvoice">Soul Voice</Trans>,
						color: SOUL_VOICE_COLOR,
						forceCollapsed: true,
					},
				}))
			}

			if (this.soulVoiceGauge.value !== event.soulVoice) {
				this.soulVoiceGauge.set(event.soulVoice)
			}
		}
	}
}
