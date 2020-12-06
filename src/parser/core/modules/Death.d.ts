import {Event} from 'legacyEvent'
import Module from '../Module'

interface RaiseEvent {
	type: 'raise'
	timestamp: number
	targetID: number
}

declare module 'legacyEvent' {
	interface EventTypeRepository {
		death: RaiseEvent
	}
}

export default class Death extends Module {
	protected shouldCountDeath(event: Event): boolean
	get deadTime(): number
}
