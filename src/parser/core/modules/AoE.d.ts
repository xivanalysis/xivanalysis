import {AbilityEvent} from 'fflogs'
import Module from 'parser/core/Module'

interface Hit {
	id: number
	instance: number
	times: number
	amount: number
}

export interface AoeEvent extends AbilityEvent {
	hits: Hit[]
	sourceID: number
	successfulHit: boolean
}

export default class AoE extends Module {}
