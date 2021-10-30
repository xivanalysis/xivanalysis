import {Action} from 'data/ACTIONS'

export interface EvaluatedAction {
	action: Action
	source: string
	target: string
	timestamp: number
}
