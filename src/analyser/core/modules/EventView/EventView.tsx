import {t} from '@lingui/macro'
import {Events} from '@xivanalysis/parser-core'
import {ALL_EVENTS, DISPLAY_MODE, Module} from 'analyser/Module'
import React from 'react'
import {EventViewComponent} from './Component'

export class EventView extends Module {
	static handle = 'eventView'
	static title = t('core.event-view.title')`Event View`

	static displayMode = DISPLAY_MODE.FULL

	private readonly events: Events.Base[] = []

	protected init() {
		this.addHook(ALL_EVENTS, event => this.events.push(event))
	}

	output() {
		return <EventViewComponent events={this.events}/>
	}
}
