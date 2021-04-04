import {Trans} from '@lingui/react'
import {Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import React from 'react'
import {Actor as ReportActor} from 'report'
import {ResourceDatum, ResourceGraphs} from '../ResourceGraphs'
import {Actor} from './Actor'

export class Actors extends Analyser {
	static handle = 'actors'
	static displayOrder = -Infinity

	@dependency private resourceGraphs!: ResourceGraphs

	private actors = new Map<ReportActor['id'], Actor>()

	initialise() {
		this.addEventHook('actorUpdate', this.onUpdate)
		this.addEventHook('complete', this.onComplete)
	}

	/** Data for the actor currently being analysed. */
	get current() {
		return this.get(this.parser.actor.id)
	}

	/** Retrive the data for the actor of the specified ID. */
	get(id: ReportActor['id']) {
		let actor = this.actors.get(id)
		if (actor != null) {
			return actor
		}

		const reportActor = this.parser.pull.actors
			.find(actor => actor.id === id)

		if (reportActor == null) {
			throw new Error(`Actor ${id} does not exist within pull ${this.parser.pull.id}`)
		}

		actor = new Actor({actor: reportActor})
		this.actors.set(id, actor)

		return actor
	}

	private onUpdate(event: Events['actorUpdate']) {
		const actor = this.get(event.actor)
		actor.update(event)
	}

	private onComplete() {
		// Build & add the current player's primary resources to the resource graphs
		const hp: ResourceDatum[] = []
		const mp: ResourceDatum[] = []

		for (const event of this.current.history) {
			if (event.hp != null) {
				hp.push({
					...hp[hp.length - 1],
					...event.hp,
					time: event.timestamp,
				})
			}
			if (event.mp != null) {
				mp.push({
					...mp[mp.length - 1],
					...event.mp,
					time: event.timestamp,
				})
			}
		}

		// Colours borroed from cactbot's jobs UI
		// TODO: Abstract the base colours if we need to reuse somewhere

		this.resourceGraphs.addResource({
			label: <Trans id="core.actors.resource.hp">HP</Trans>,
			colour: 'rgba(59, 133, 4, 0.5)',
			data: hp,
		})

		// Some jobs do not use MP at all - hide if we get no info beyond the initial data dump
		if (mp.length > 1) {
			this.resourceGraphs.addResource({
				label: <Trans id="core.actors.resource.mp">MP</Trans>,
				colour: 'rgba(188, 55, 147, 0.5)',
				data: mp,
			})
		}
	}
}
