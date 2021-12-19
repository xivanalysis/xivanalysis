import {JobKey} from 'data/JOBS'
import {Status} from 'data/STATUSES'
import {Attribute, AttributeValue, Events, Position, Resource} from 'event'
import _ from 'lodash'
import {Actor as ReportActor, Team} from 'report'
import {Object} from 'ts-toolbelt'
import {SUB_ATTRIBUTE_MINIMUM} from 'utilities/speedStatMapper'

export type StatusEvent = Events['statusApply'] | Events['statusRemove']
type StatusHistory = Map<Status['id'], Map<Actor['id'], StatusEvent[]>>

type ToReadonly<T> =
	T extends Map<infer K, infer V> ? ReadonlyMap<ToReadonly<K>, ToReadonly<V>>
	: T

/** Representation of resources of an actor at a point in time. */
class ActorResources {
	hp: Readonly<Resource>
	mp: Readonly<Resource>
	position: Readonly<Position>
	get targetable() {
		return this.getHistoricalValue(event => event.targetable, true)
	}
	attributes: Readonly<Record<Attribute, AttributeValue>>

	protected _updateHistory: Array<Events['actorUpdate']>
	protected _statusHistory: StatusHistory
	private time?: number

	constructor(opts: {
		updateHistory?: Array<Events['actorUpdate']>
		statusHistory?: StatusHistory
		time?: number
	}) {
		this._updateHistory = opts.updateHistory ?? []
		this._statusHistory = opts.statusHistory ?? new Map()
		this.time = opts.time
		this.hp = this.buildResource('hp')
		this.mp = this.buildResource('mp')
		this.position = this.buildPosition()
		this.attributes = this.buildAttributes()
	}

	hasStatus(statusId: Status['id'], source?: Actor['id']) {
		return this.getStatusApplication(statusId, source) != null
	}

	getStatusData(statusId: Status['id'], source?: Actor['id']) {
		return this.getStatusApplication(statusId, source)?.data
	}

	private getStatusApplication(statusId: Status['id'], source?: Actor['id']) {
		// Grab data for the requested status - if there is none, we can resolve early.
		const statusEvents = this._statusHistory.get(statusId)
		if (statusEvents == null) {
			return
		}

		// Narrow to a single source if requested
		const requestedSourceEvents = source != null
			? [statusEvents.get(source) ?? []]
			: statusEvents.values()

		const time = this.time ?? Infinity

		// Search sources for an open application
		for (const sourceEvents of requestedSourceEvents) {
			const lastEvent = _.findLast(sourceEvents, event => event.timestamp <= time)
			if (lastEvent?.type === 'statusApply') {
				return lastEvent
			}
		}
	}

	// TODO: think of how to automate building these getters this is dumb

	/** Build a "Resource" that will retrieve values from the history array. */
	private buildResource(field: Object.SelectKeys<Events['actorUpdate'], Resource, '<-extends'>) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return {
			get maximum() {
				return self.getHistoricalValue(event => event[field]?.maximum, 0)
			},
			get current() {
				return self.getHistoricalValue(event => event[field]?.current, 0)
			},
		}
	}

	/** Build a "Position" that will retreive values from the history array. */
	private buildPosition() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return {
			get x() {
				return self.getHistoricalValue(event => event.position?.x, 0)
			},
			get y() {
				return self.getHistoricalValue(event => event.position?.y, 0)
			},
			get bearing() {
				return self.getHistoricalValue(event => event.position?.bearing, 0)
			},
		}
	}

	private buildAttributes() {
		const getHistoricalAttribute = (attribute: Attribute) =>
			this.getHistoricalValue(
				event => event.attributes?.find(eventAttr => eventAttr.attribute === attribute),
				{attribute, value: SUB_ATTRIBUTE_MINIMUM, estimated: true}
			)

		return {
			get [Attribute.SKILL_SPEED]() {
				return getHistoricalAttribute(Attribute.SKILL_SPEED)
			},
			get [Attribute.SPELL_SPEED]() {
				return getHistoricalAttribute(Attribute.SPELL_SPEED)
			},
		}
	}

	/**
	 * Retrieve the most recent value as fetched by `getter` occuring
	 * before `this.time`, if it is set.
	 */
	private getHistoricalValue<T>(
		getter: (x: Events['actorUpdate']) => T | undefined,
		fallback: T,
	): T {
		// Infinity -> most recent data point
		const time = this.time ?? Infinity
		// TODO: Work out how to optimise this w/ cache &c
		for (let i = this._updateHistory.length - 1; i >= 0; i--) {
			const event = this._updateHistory[i]
			// If it's in the future of what we're looking for, ignore
			// TODO: Can we avoid looping through shit we already know?
			if (event.timestamp > time) { continue }

			// Grab the value for this event - if it's not present, ignore
			const value = getter(event)
			if (value == null) { continue }

			return value
		}

		return fallback
	}
}

interface ActorOptions {
	actor: ReportActor
}

export class Actor extends ActorResources implements ReportActor {
	// we re-export the actor shape so people don't need to dig into `Pull` to get it.
	readonly id: string
	readonly kind: string
	readonly name: string
	readonly team: Team
	readonly playerControlled: boolean
	readonly owner?: ReportActor
	readonly job: JobKey

	/** Read-only view of the update history of this actor. */
	get updateHistory(): ReadonlyArray<Events['actorUpdate']> {
		return this._updateHistory
	}

	/** Read-only view of the status history of this actor. */
	get statusHistory(): ToReadonly<StatusHistory> {
		return this._statusHistory
	}

	constructor({actor}: ActorOptions) {
		super({})
		this.id = actor.id
		this.kind = actor.kind
		this.name = actor.name
		this.team = actor.team
		this.playerControlled = actor.playerControlled
		this.owner = actor.owner
		this.job = actor.job
	}

	/** Get actor resources at a specified point in time. */
	at(time: number) {
		// TODO: perhaps pre-compute history slice here, based on time? Will depend on usage -
		// a few `at` calls with lots of lookups will preference a slice, a lot of `at` calls
		// with a few lookups, the current impl.
		return new ActorResources({
			updateHistory: this._updateHistory,
			statusHistory: this._statusHistory,
			time,
		})
	}

	addUpdateEntry(event: Events['actorUpdate']) {
		// This pushes to the history in the parent class, which is effectively reference-
		// shared by all ActorResource instances generated by this Actor
		this._updateHistory.push(event)
	}

	addStatusEntry(event: StatusEvent) {
		let statusEvents = this._statusHistory.get(event.status)
		if (statusEvents == null) {
			statusEvents = new Map()
			this._statusHistory.set(event.status, statusEvents)
		}

		let sourceEvents = statusEvents.get(event.source)
		if (sourceEvents == null) {
			sourceEvents = []
			statusEvents.set(event.source, sourceEvents)
		}

		sourceEvents.push(event)
	}
}
