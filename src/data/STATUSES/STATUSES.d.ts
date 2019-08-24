import {Action} from 'data/ACTIONS/ACTIONS'

export interface Status {
	id: number
	name: string
	icon: string
	duration?: number
	action?: Action
}
