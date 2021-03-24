import {JobKey} from 'data/JOBS'
import {Events, Position, Resource} from 'event'
import {Actor as ReportActor, Team} from 'report'
import {Object} from 'ts-toolbelt'

/** Representation of resources of an actor at a point in time. */
class ActorResources {
	hp: Readonly<Resource>
	mp: Readonly<Resource>
	position: Readonly<Position>

	protected history: Array<Events['actorUpdate']> = []
	private time?: number

	constructor(opts: {
		history?: Array<Events['actorUpdate']>
		time?: number
	}) {
		this.history = opts.history ?? []
		this.time = opts.time
		this.hp = this.buildResource('hp')
		this.mp = this.buildResource('mp')
		this.position = this.buildPosition()
	}

	// TODO: think of how to automate building these getters this is dumb

	/** Build a "Resource" that will retrieve values from the history array. */
	private buildResource(field: Object.SelectKeys<Events['actorUpdate'], Resource, '<-extends'>) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return {
			get maximum() {
				return self.getHistoricalValue(event => event[field]?.maximum)
			},
			get current() {
				return self.getHistoricalValue(event => event[field]?.current)
			},
		}
	}

	/** Build a "Position" that will retreive values from the history array. */
	private buildPosition() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return {
			get x() {
				return self.getHistoricalValue(event => event.position?.x)
			},
			get y() {
				return self.getHistoricalValue(event => event.position?.y)
			},
			get bearing() {
				return self.getHistoricalValue(event => event.position?.bearing)
			},
		}
	}

	/**
	 * Retrieve the most recent value as fetched by `getter` occuring
	 * before `this.time`, if it is set.
	 */
	private getHistoricalValue(
		getter: (x: Events['actorUpdate']) => number | undefined,
	): number {
		// Infinity -> most recent data point
		const time = this.time ?? Infinity
		// TODO: Work out how to optimise this w/ cache &c
		for (let i = this.history.length - 1; i >= 0; i--) {
			const event = this.history[i]
			// If it's in the future of what we're looking for, ignore
			// TODO: Can we avoid looping through shit we already know?
			if (event.timestamp > time) { continue }

			// Grab the value for this event - if it's not present, ignore
			const value = getter(event)
			if (value == null) { continue }

			return value
		}

		return 0
	}
}

interface ActorOptions {
	actor: ReportActor
}

export class Actor extends ActorResources implements ReportActor {
	// we re-export the actor shape so people don't need to dig into `Pull` to get it.
	readonly id: string
	readonly name: string
	readonly team: Team
	readonly playerControlled: boolean
	readonly owner?: ReportActor
	readonly job: JobKey

	constructor({actor}: ActorOptions) {
		super({})
		this.id = actor.id
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
			history: this.history,
			time,
		})
	}

	update(event: Events['actorUpdate']) {
		// This pushes to the history in the parent class, which is effectively reference-
		// shared by all ActorResource instances generated by this Actor
		this.history.push(event)
	}
}
