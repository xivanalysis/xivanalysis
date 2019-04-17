import {Actor, Events} from '@xivanalysis/parser-core'
import {isDefined} from 'utilities'
import * as AVAILABLE_MODULES from './AVAILABLE_MODULES'
import {Module} from './Module'

/*
👏    NO    👏
👏  FFLOGS  👏
👏    IN    👏
👏   THE    👏
👏 ANALYSER 👏
*/

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

	async loadModules() {
		// TODO: Job & zone
		// NOTE: Order of groups here is the order they will be loaded in. Later groups
		//       override earlier groups.
		const metas = [
			AVAILABLE_MODULES.CORE,
		].filter(isDefined)

		// Load in the modules
		// If this throws, then there was probably a deploy between page load and this call. Tell them to refresh.
		let modules: ReadonlyArray<ReadonlyArray<typeof Module>>
		try {
			modules = await Promise.all(metas.map(meta => meta.loadModules()))
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			throw new Error('TODO: Use the proper error for this')
		}

		// TODO: Load the modules
		console.log('we loaded the modules fam', modules)
	}
}
