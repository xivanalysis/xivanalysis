import {Action} from 'data/ACTIONS'
import {Actor} from '../Actors'

export interface EvaluatedAction {
	action: Action
	source: Actor['id']
	target: Actor['id']
	timestamp: number
}
