import {t} from '@lingui/macro'
import {Events} from '@xivanalysis/parser-core'
import {eventMeta} from 'analyser/Events'
import {ALL_EVENTS, DISPLAY_MODE, Module} from 'analyser/Module'
import React from 'react'
import {EventViewComponent} from './Component'

export interface EventMeta {
	timestamp: React.ReactNode
	description: React.ReactNode
	event: Events.Base
}

export class EventView extends Module {
	static handle = 'eventView'
	static title = t('core.event-view.title')`Event View`

	static displayMode = DISPLAY_MODE.FULL

	private readonly meta: EventMeta[] = []

	protected init() {
		this.addHook(ALL_EVENTS, this.onEvent)
	}

	private onEvent(event: Events.Base) {
		this.meta.push({
			timestamp: this.analyser.formatTimestamp(event.timestamp),
			description: this.formatEvent(event),
			event,
		})
	}

	private formatEvent(event: Events.Base): string {
		const meta = eventMeta.get(event.type)
		if (!meta || !meta.formatter) {
			return JSON.stringify(event)
		}

		return meta.formatter(event)
	}

	output() {
		return <EventViewComponent
			meta={this.meta}
		/>
	}
}
