import {Action} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module from 'parser/core/Module'

// TODO: Refactor such that this isn't required
interface JankFakeEvent {
	type: undefined
	timestamp: number
}

export interface WeaveInfo {
	leadingGcdEvent: CastEvent | JankFakeEvent
	trailingGcdEvent: CastEvent
	gcdTimeDiff: number
	weaves: CastEvent[]
}

export default class Weaving extends Module {
	isOgcd(action: Action): boolean
	isBadWeave(weave: WeaveInfo, maxWeaves?: number): boolean
}
