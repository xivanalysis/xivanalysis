import Tooltip from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import _ from 'lodash'
import React from 'react'
import {Actor, Team} from 'report'
import {Analyser} from '../Analyser'
import {filter, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {SimpleItem, SimpleRow, Timeline} from './Timeline'

interface Hit {
	prepare?: Events['prepare']
	action?: Events['action']
}

export class EnemyTimeline extends Analyser {
	static override handle = 'enemyTimeline'

	@dependency timeline!: Timeline

	private hits = new Map<Actor['id'], Hit[]>()

	override initialise() {
		const foes = this.parser.pull.actors
			.filter(actor => actor.team === Team.FOE)
			.map(actor => actor.id)

		this.addEventHook(
			filter<Event>()
				.type('prepare')
				.source(oneOf(foes)),
			this.onPrepare,
		)

		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(oneOf(foes)),
			this.onAction
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onPrepare(event: Events['prepare']) {
		const hits = this.getActorHits(event.source)
		hits.push({prepare: event})
	}

	private onAction(event: Events['action']) {
		const hits = this.getActorHits(event.source)
		const lastHit = _.last(hits)

		// yi kes
		if (
			lastHit?.prepare?.action === event.action
			&& lastHit?.prepare.target === event.target
		) {
			lastHit.action = event
			return
		}

		hits.push({action: event})
	}

	private getActorHits(actorId: Actor['id']) {
		let hits = this.hits.get(actorId)
		if (hits != null) { return hits }

		hits = []
		this.hits.set(actorId, hits)
		return hits
	}

	private onComplete() {
		const rootRow = this.timeline.addRow(new SimpleRow({
			label: 'enemy',
		}))

		// big yikes
		for (const [actorId, hits] of this.hits) {
			const actorRow = rootRow.addRow(new SimpleRow({
				label: actorId,
			}))

			const actionRowCache = new Map<Action['id'], SimpleRow>()

			for (const hit of hits) {
				const meta = hit.action ?? hit.prepare
				if (meta == null) { continue }

				let actionRow = actionRowCache.get(meta.action)
				if (actionRow == null) {
					actionRow = actorRow.addRow(new SimpleRow({
						label: <Tooltip id={meta.action} sheet="Action"/>,
					}))
					actionRowCache.set(meta.action, actionRow)
				}

				const start = hit.prepare != null
					? hit.prepare.timestamp
					: hit.action?.timestamp ?? this.parser.currentEpochTimestamp

				const end = hit.prepare != null
					? hit.action?.timestamp ?? undefined
					: undefined

				// yikmes
				actionRow.addItem(new SimpleItem({
					start: start - this.parser.pull.timestamp,
					end: end && end - this.parser.pull.timestamp,
					content: <div style={{
						width: end == null ? 1 : undefined,
						height: '100%',
						background: 'red',
					}}/>,
				}))
			}
		}
	}
}
