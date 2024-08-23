import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {Gauge} from 'parser/core/modules/Gauge'
import {SetGauge} from 'parser/core/modules/Gauge/SetGauge'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import React from 'react'

const SONGS: ActionKey[] = [
	'THE_WANDERERS_MINUET',
	'ARMYS_PAEON',
	'MAGES_BALLAD',
	'RADIANT_FINALE',
]

const WANDERERS_VALUE = 'wanderers'
const ARMYS_VALUE = 'armys'
const MAGES_VALUE = 'mages'

const WANDERERS_COLOR = Color('#add549').fade(GAUGE_FADE)
const ARMYS_COLOR = Color('#eb9b5f').fade(GAUGE_FADE)
const MAGES_COLOR = Color('#ffbcf8').fade(GAUGE_FADE)

export class Coda extends Gauge {
	static override handle = 'coda'
	private songIds = SONGS.map(song => this.data.actions[song].id)

	private codaGauge = this.add(new SetGauge({
		options: [
			{
				value: WANDERERS_VALUE,
				label: <Trans id="brd.coda.wanderers.label">Wanderer's Coda</Trans>,
				color: WANDERERS_COLOR,
			},
			{
				value: ARMYS_VALUE,
				label: <Trans id="brd.coda.armys.label">Army's Coda</Trans>,
				color: ARMYS_COLOR,
			},
			{
				value: MAGES_VALUE,
				label: <Trans id="brd.coda.mages.label">Mage's Coda</Trans>,
				color: MAGES_COLOR,
			},
		],
		graph: {
			handle: 'coda',
			label: <Trans id="brd.coda.gauge.label">Coda</Trans>,
		},
	}))
	override initialise() {
		super.initialise()
		this.addEventHook(filter<Event>().type('action').source(this.parser.actor.id)
			.action(oneOf(this.songIds)), this.onSong)
	}
	private onSong(event: Events['action']) {
		const action = event.action
		switch (action) {
		case this.data.actions.THE_WANDERERS_MINUET.id:
			this.codaGauge.generate(WANDERERS_VALUE)
			break
		case this.data.actions.ARMYS_PAEON.id:
			this.codaGauge.generate(ARMYS_VALUE)
			break
		case this.data.actions.MAGES_BALLAD.id:
			this.codaGauge.generate(MAGES_VALUE)
			break
		case this.data.actions.RADIANT_FINALE.id:
			this.codaGauge.reset()
			break
		}
	}
}
