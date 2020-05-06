import {Event} from 'events'
import Module from '../Module'

interface RaiseEvent {
	type: 'raise'
	timestamp: number
	targetID: number
}

declare module 'events' {
	interface EventTypeRepository {
		death: RaiseEvent
	}
}

export default class Death extends Module {
	protected shouldCountDeath(event: Event): boolean
	get deadTime(): number
}
