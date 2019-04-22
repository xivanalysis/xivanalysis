import {t} from '@lingui/macro'
import {Events} from '@xivanalysis/parser-core'
import {dependency} from 'analyser/dependency'
import {eventMeta} from 'analyser/Events'
import {ALL_EVENTS, DISPLAY_MODE, Module} from 'analyser/Module'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import React from 'react'
import {Actors} from '../Actors'
import {EventViewComponent} from './Component'

export interface EventMeta {
	timestamp: React.ReactNode
	name: React.ReactNode,
	description: React.ReactNode
	event: Events.Base
}

export class EventView extends Module {
	static handle = 'eventView'
	static title = t('core.event-view.title')`Event View`

	static displayMode = DISPLAY_MODE.FULL

	// Dependencies
	@dependency private actors!: Actors

	private readonly meta: EventMeta[] = []

	private formatters = {
		actor: this.formatActor.bind(this),
		action: this.formatAction.bind(this),
		status: this.formatStatus.bind(this),
	}

	protected init() {
		this.addHook(ALL_EVENTS, this.onEvent)
	}

	private onEvent(event: Events.Base) {
		const meta = eventMeta.get(event.type)

		this.meta.push({
			timestamp: this.analyser.formatTimestamp(event.timestamp),
			name: meta && meta.name ? meta.name : event.type,
			description: meta && meta.formatter
				? meta.formatter(event, this.formatters)
				: JSON.stringify(event),
			event,
		})
	}

	private formatActor(actorId: number): React.ReactNode {
		const actor = this.actors.getActor(actorId)
		if (!actor) { return `Actor:${actorId}` }

		return <>
			{actor.name}
			{actor.ownerId && <>&nbsp;({this.formatActor(actor.ownerId)})</>}
		</>
	}

	private formatAction(actionId: number) {
		const action = getDataBy(ACTIONS, 'id', actionId)
		return action
			? <ActionLink {...action}/>
			: <ActionLink id={actionId} name={`Action:${actionId}`}/>
	}

	private formatStatus(statusId: number) {
		const status = getDataBy(STATUSES, 'id', statusId)
		return status
			? <StatusLink {...status}/>
			: <StatusLink id={statusId} name={`Status:${statusId}`}/>
	}

	output() {
		return <EventViewComponent
			meta={this.meta}
		/>
	}
}
