import {Actor, Events} from '@xivanalysis/parser-core'
import {MappedDependency} from 'parser/core/Module'
import toposort from 'toposort'
import {isDefined} from 'utilities'
import * as AVAILABLE_MODULES from './AVAILABLE_MODULES'
import {Handle, Module} from './Module'

/*
👏    NO    👏
👏  FFLOGS  👏
👏    IN    👏
👏   THE    👏
👏 ANALYSER 👏
*/

export interface Hook<T extends Events.Base> {
	module: Handle,
	event: T['type'],
	filter: Partial<T>,
	callback: (event: T) => void,
}

// TODO: should this be in the parser?
const isAddActor = (event: Events.Base): event is Events.AddActor =>
	event.type === Events.Type.ADD_ACTOR

const generateActorFinder = (id: Actor['id']) =>
	(event: Events.Base): event is Events.AddActor =>
		isAddActor(event) && event.actor.id === id

export class Analyser {
	private readonly events: Events.Base[]
	private readonly actor: Actor
	private readonly zoneId: number

	/** Map of available modules. */
	private readonly modules = new Map<Handle, Module>()
	/** Module handles sorted per module loading order. */
	private moduleOrder: Handle[] = []

	/**
	 * Mapping of event types to an array of hooks for them, ordered per the
	 * module loading order.
	 */
	private readonly hooks = new Map<
		Events.Base['type'] | symbol,
		Array<Hook<Events.Base>>
	>()

	constructor(opts: {
		events: Events.Base[],
		actorId: Actor['id'],
		zoneId: number,
	}) {
		this.events = opts.events
		this.zoneId = opts.zoneId

		// Find the AddActor event for the provided actor
		// If they aren't added, we can't analyse them, so throw
		const event = opts.events.find(generateActorFinder(opts.actorId))
		if (!event) {
			// TODO: Proper error
			throw new Error('Could not find actor matching the ID specified.')
		}
		this.actor = event.actor
	}

	async init() {
		const constructors = await this.loadModules()
		this.buildModules(constructors)
	}

	private async loadModules() {
		// TODO: Job & zone
		// NOTE: Order of groups here is the order they will be loaded in. Later groups
		//       override earlier groups.
		const metas = [
			AVAILABLE_MODULES.CORE,
		].filter(isDefined)

		// Load in the modules
		// If this throws, then there was probably a deploy between page load and this call. Tell them to refresh.
		let groupedConstructors: ReadonlyArray<ReadonlyArray<typeof Module>>
		try {
			groupedConstructors = await Promise.all(metas.map(meta => meta.loadModules()))
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			throw new Error('TODO: Use the proper error for this')
		}

		const constructors: Record<string, typeof Module> = {}
		groupedConstructors.flat().forEach(constructor => {
			constructors[constructor.handle] = constructor
		})

		return constructors
	}

	private buildModules(constructors: Record<string, typeof Module>) {
		// Build the values we need for the toposort
		const nodes = Object.keys(constructors)
		const edges: Array<[string, string]> = []
		nodes.forEach(mod => constructors[mod].dependencies.forEach(dep => {
			edges.push([mod, this.getDepHandle(dep)])
		}))

		// Sort modules to load dependencies first
		// Reverse is required to switch it into depencency order instead of sequence
		// This will naturally throw an error on cyclic deps
		this.moduleOrder = toposort.array(nodes, edges).reverse()

		// Initialise the modules
		this.moduleOrder.forEach(mod => {
			this.modules.set(mod, new constructors[mod]())
		})
	}

	private getDepHandle(dep: string | MappedDependency) {
		if (typeof dep === 'string') {
			return dep
		}

		return dep.handle
	}
}
