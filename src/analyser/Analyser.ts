import {Actor, Events} from '@xivanalysis/parser-core'

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

	constructor(opts: {
		events: Events.Base[],
		actorId: Actor['id'],
	}) {
		this.events = opts.events

		// Find the AddActor event for the provided actor
		// If they aren't added, we can't analyse them, so throw
		const event = opts.events.find(generateActorFinder(opts.actorId))
		if (!event) {
			// TODO: Proper error
			throw new Error('Could not find actor matching the ID specified.')
		}
		this.actor = event.actor

		// TODO: HOW DO I SIGNAL WHAT BOSS IT IS?
		//       Should I split "boss" modules by zone instead?
	}
}
